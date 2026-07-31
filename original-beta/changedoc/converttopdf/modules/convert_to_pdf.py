import os
import logging
import subprocess
import time
import threading
from pathlib import Path

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logging.debug("psutil not available, resource monitoring disabled")

import uno


class ConversionTimeoutError(Exception):
    """PDF変換タイムアウト例外"""
    pass


# UNO 接続ユーティリティ --------------------------------------------------
def check_system_resources():
    """
    システムリソースをチェックし、LibreOffice起動可否を判断
    """
    if not PSUTIL_AVAILABLE:
        return
        
    try:
        # メモリ使用率チェック
        memory = psutil.virtual_memory()
        mem_available_gb = memory.available / (1024 ** 3)
        mem_percent = memory.percent
        
        # 既存のLibreOfficeプロセス数をカウント
        lo_process_count = sum(1 for p in psutil.process_iter(['name']) 
                              if 'soffice' in p.info['name'].lower())
        
        logging.info(f"System resources - Memory: {mem_available_gb:.2f}GB available ({mem_percent:.1f}% used), "
                    f"LibreOffice processes: {lo_process_count}")
        
        # リソース不足の警告
        if mem_available_gb < 0.5:
            logging.warning(f"Low memory warning: {mem_available_gb:.2f}GB available")
        if lo_process_count >= 5:
            logging.warning(f"Many LibreOffice processes running: {lo_process_count}")
            
    except Exception as e:
        logging.debug(f"Resource check failed (non-critical): {e}")


def connect_office(pipe_name=None):
    """
    LibreOfficeプロセスに接続する
    
    Args:
        pipe_name: パイプ名。Noneの場合は一意な名前を生成（推奨）
    
    Returns:
        tuple: (context, process) - processは常にPopenオブジェクト
    """
    import uuid
    
    # リソースチェック（大量同時実行時の警告用）
    check_system_resources()
    
    # 各ファイル処理で独立したpipe名を使用（並行処理時の干渉を防ぐ）
    if pipe_name is None:
        pipe_name = f"office_pipe_{uuid.uuid4().hex[:8]}"
    
    local_ctx = uno.getComponentContext()
    resolver = local_ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", local_ctx
    )

    uri = f"uno:pipe,name={pipe_name};urp;StarOffice.ComponentContext"

    # 新しいLibreOfficeプロセスを起動（既存プロセスの再利用は行わない）
    logging.info(f"Starting new LibreOffice process with pipe: {pipe_name}")
    process = subprocess.Popen(
        [
            "soffice",
            "--headless",
            "--nologo",
            "--nofirststartwizard",
            f"--accept=pipe,name={pipe_name};urp;",
            f"-env:UserInstallation=file:///tmp/lo_{pipe_name}",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # 最大 5 分待機（100ms × 3000）
    for i in range(3000):
        try:
            ctx = resolver.resolve(uri)
            logging.info(f"Connected to LibreOffice after {i * 0.1:.1f}s (pipe: {pipe_name})")
            return ctx, process
        except Exception:
            if process.poll() is not None:
                raise RuntimeError(f"LibreOffice process terminated unexpectedly (exit code: {process.returncode})")
            time.sleep(0.1)
    
    # タイムアウト - プロセスをクリーンアップ
    logging.error(f"LibreOffice connection timeout for pipe: {pipe_name}")
    process.kill()
    process.wait()
    raise RuntimeError("LibreOffice pipe connect timeout")


def cleanup_office_process(process):
    """LibreOfficeプロセスを安全に終了"""
    if not process:
        logging.debug("No process to cleanup")
        return
        
    if process.poll() is not None:
        logging.info(f"LibreOffice process already terminated (exit code: {process.returncode})")
        return
    
    try:
        logging.info(f"Terminating LibreOffice process (PID: {process.pid})")
        process.terminate()
        process.wait(timeout=5)
        logging.info("LibreOffice process terminated gracefully")
    except subprocess.TimeoutExpired:
        logging.warning(f"Process termination timeout, killing process (PID: {process.pid})")
        process.kill()
        process.wait()
        logging.warning("LibreOffice process forcefully killed")
    except Exception as e:
        logging.error(f"Error cleaning up LibreOffice process: {e}")


def set_landscape(doc):
    """プリンタ設定を横向き (Landscape) に固定する最小コード"""
    opts = list(doc.getPrinter())  # tuple → list（編集可能に）

    for pv in opts:  # 既存エントリを探す
        if pv.Name in ("Orientation", "PaperOrientation"):
            pv.Value = 1  # 0 = Portrait, 1 = Landscape
            doc.setPrinter(tuple(opts))
            return  # 更新して終了

    # 見つからなければ新規追加
    pv = uno.createUnoStruct("com.sun.star.beans.PropertyValue")
    pv.Name, pv.Value = "PaperOrientation", 1
    opts.append(pv)

    doc.setPrinter(tuple(opts))  # list → tuple で保存


# ページ設定をファイル種別ごとに適用 --------------------------------------
def apply_layout(doc, ext: str):
    if ext in (".xlsx", ".xls"):
        # ---- プリンタ設定で横向きに固定 ----
        # prn = doc.getPrinter()  # {str:any} のディクショナリ
        # print(prn)

        # Excel: 横向き + 幅 1 ページ
        set_landscape(doc)
        sheets = doc.getSheets()
        styles = doc.getStyleFamilies().getByName("PageStyles")
        for name in sheets.getElementNames():
            ps = styles.getByName(sheets.getByName(name).PageStyle)
            # landscape = uno.Enum("com.sun.star.view.PaperOrientation", "LANDSCAPE")

            ps.IsLandscape = True  # 横向き
            # ps.setPropertyValue("PaperOrientation", 1)  # ← 追加

            ps.ScaleToPagesX = 1  # 横幅 1 ページ
            ps.ScaleToPagesY = 0  # 縦方向は自動改ページ

            ps.TopMargin = 500  # 上余白 5 mm
            ps.BottomMargin = 500  # 下余白 5 mm
            ps.LeftMargin = 500  # 左余白 5 mm
            ps.RightMargin = 500  # 右余白 5 mm

    elif ext in (".pptx", ".ppt"):
        # プレゼンテーションファイルは特別な設定不要
        # ドキュメントプロパティの取得のみ実行
        try:
            doc.getDocumentProperties()
            logging.info(f"Presentation document loaded: {ext}")
        except Exception as e:
            logging.warning(f"Failed to get document properties for {ext}: {e}")

    elif ext in (".docx", ".doc"):
        try:
            settings = doc.getDocumentSettings()
            if hasattr(settings, "ShowChanges") and settings.ShowChanges:
                doc.AcceptAllTrackedChanges()
                logging.info("Tracked changes accepted")
        except Exception as e:
            logging.error(f"Error applying Word document layout: {e}")


# エクスポート処理本体 ------------------------------------------------------
FILTER_MAP = {
    ".xlsx": ("calc_pdf_Export",),
    ".xls": ("calc_pdf_Export",),
    ".pptx": ("impress_pdf_Export",),
    ".ppt": ("impress_pdf_Export",),
    ".docx": ("writer_pdf_Export",),
    ".doc": ("writer_pdf_Export",),
}


def _convert_to_pdf_core(input_path: str, output_dir: str, result_container: dict):
    """PDF変換のコア処理（スレッドで実行）"""
    ext = Path(input_path).suffix.lower()
    process = None
    doc = None
    
    try:
        # 各ファイル処理で独立したプロセスを起動
        ctx, process = connect_office(pipe_name=None)
        smgr = ctx.ServiceManager
        desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)

        url = uno.systemPathToFileUrl(os.path.abspath(input_path))
        doc = desktop.loadComponentFromURL(url, "_blank", 0, [])
        if doc is None:
            raise RuntimeError(f"Failed to load document: {input_path}")

        apply_layout(doc, ext)

        pdf_path = os.path.join(
            output_dir, os.path.basename(input_path).replace(os.path.splitext(input_path)[1], f"_{os.path.splitext(input_path)[1][1:]}.pdf")
        )

        pdf_url = uno.systemPathToFileUrl(os.path.abspath(pdf_path))
        props = (uno.createUnoStruct("com.sun.star.beans.PropertyValue"),)
        props[0].Name, props[0].Value = "FilterName", FILTER_MAP[ext][0]
        
        logging.info(f"PDF変換開始: {input_path} -> {pdf_path}")
        doc.storeToURL(pdf_url, props)
        logging.info(f"PDF変換完了: {pdf_path}")
        
        result_container["success"] = True
        result_container["pdf_path"] = pdf_path
        
    except Exception as e:
        result_container["success"] = False
        result_container["error"] = e
        logging.error(f"PDF変換エラー: {e}", exc_info=True)
    finally:
        # ドキュメントのクローズ
        if doc:
            try:
                doc.close(True)
                logging.info("Document closed")
            except Exception as e:
                logging.error(f"Failed to close document: {e}")
        
        # プロセスのクリーンアップ
        if process:
            result_container["process"] = process


def convert_to_pdf(input_path: str, output_dir: str, timeout_seconds: int = 600):
    """
    OfficeファイルをPDFに変換（タイムアウト付き）
    
    Args:
        input_path: 入力ファイルパス
        output_dir: 出力ディレクトリ
        timeout_seconds: タイムアウト秒数（デフォルト10分）
    
    Returns:
        str: 生成されたPDFファイルのパス
    
    Raises:
        ValueError: サポートされていない拡張子の場合
        ConversionTimeoutError: タイムアウトした場合
        RuntimeError: ドキュメント読み込みに失敗した場合
    """
    ext = Path(input_path).suffix.lower()
    if ext not in FILTER_MAP:
        raise ValueError(f"Unsupported extension: {ext}")

    result_container = {"success": False, "process": None}
    
    # スレッドで変換処理を実行
    thread = threading.Thread(
        target=_convert_to_pdf_core,
        args=(input_path, output_dir, result_container),
        daemon=True
    )
    
    thread.start()
    thread.join(timeout=timeout_seconds)
    
    process = None
    try:
        if thread.is_alive():
            # タイムアウト発生 - プロセスを強制終了
            logging.error(f"PDF変換が{timeout_seconds}秒でタイムアウトしました: {input_path}")
            process = result_container.get("process")
            if process:
                logging.warning(f"タイムアウト: LibreOfficeプロセスを強制終了します (PID: {process.pid if process else 'unknown'})")
                try:
                    process.kill()
                    process.wait(timeout=5)
                    logging.info("LibreOfficeプロセスを強制終了しました")
                except Exception as e:
                    logging.error(f"プロセス強制終了エラー: {e}")
            else:
                logging.warning("タイムアウト時にプロセスが取得できませんでした")
            raise ConversionTimeoutError(f"処理が{timeout_seconds}秒でタイムアウトしました: {input_path}")
        
        # 変換結果を確認
        if result_container["success"]:
            pdf_path = result_container["pdf_path"]
            logging.info(f"PDF変換成功: {input_path} -> {pdf_path}")
            return pdf_path
        else:
            error = result_container.get("error")
            if error:
                raise error
            else:
                raise RuntimeError(f"PDF変換が失敗しました（詳細不明）: {input_path}")
    finally:
        # プロセスのクリーンアップ（必ず実行）
        if not process:
            process = result_container.get("process")
        if process:
            cleanup_office_process(process)
        else:
            logging.debug("クリーンアップ対象のプロセスがありません")