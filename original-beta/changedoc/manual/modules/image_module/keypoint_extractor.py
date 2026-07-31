"""Video keypoint extraction using image hash."""

from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import List, Tuple

import cv2
import imagehash
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class KeypointExtractor:
    """Image hashを使用した動画キーポイント抽出器。
    
    動画の各フレームからimage hashを計算し、
    hash値の変化が大きいフレームをキーポイントとして抽出する。
    """

    def __init__(
        self,
        hash_size: int = 8,
        threshold: float = 5.0,
        min_interval: int = 30,
        hash_algorithm: str = "dhash"
    ):
        """
        Args:
            hash_size: ハッシュのサイズ（デフォルト: 8x8=64bit）
            threshold: キーポイント判定の閾値（デフォルト: 5.0、Noneは許可しない）
            min_interval: キーポイント間の最小間隔（フレーム数、デフォルト: 30）
            hash_algorithm: 使用するハッシュアルゴリズム（dhash, phash, ahash, whash）
        """
        self.hash_size = hash_size
        # thresholdがNoneの場合はデフォルト値を使用
        self.threshold = threshold if threshold is not None else 5.0
        self.min_interval = min_interval
        self.hash_algorithm = hash_algorithm
        
        # ハッシュ関数をマッピング
        self.hash_functions = {
            "dhash": imagehash.dhash,
            "phash": imagehash.phash,
            "ahash": imagehash.average_hash,
            "whash": imagehash.whash
        }
        
        if hash_algorithm not in self.hash_functions:
            raise ValueError(f"Unsupported hash algorithm: {hash_algorithm}")

    def _resize_frame_if_needed(self, frame: np.ndarray, max_long_side: int = 1024) -> np.ndarray:
        """フレームの長辺がmax_long_sideに収まるようにリサイズ。
        
        Args:
            frame: OpenCVで読み込んだフレーム（BGR）
            max_long_side: 長辺の最大サイズ
            
        Returns:
            リサイズされたフレーム（または元のフレーム）
        """
        height, width = frame.shape[:2]
        long_side = max(width, height)
        
        if long_side <= max_long_side:
            return frame
        
        # アスペクト比を維持してリサイズ
        scale = max_long_side / long_side
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        resized = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_AREA)
        logger.debug(f"Resized frame from {width}x{height} to {new_width}x{new_height}")
        return resized

    def _calculate_frame_hash(self, frame: np.ndarray) -> imagehash.ImageHash:
        """フレームのimage hashを計算。
        
        Args:
            frame: OpenCVで読み込んだフレーム（BGR）
            
        Returns:
            計算されたimage hash
        """
        # BGR -> RGB変換
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # PIL Imageに変換
        pil_image = Image.fromarray(rgb_frame)
        
        # ハッシュを計算
        hash_func = self.hash_functions[self.hash_algorithm]
        return hash_func(pil_image, hash_size=self.hash_size)

    def extract_keypoints(
        self,
        video_path: str,
        output_dir: str,
        max_keypoints: int = 50,
        frame_skip: int = 30,
    ) -> Tuple[List[Tuple[int, str]], List[Tuple[int, int, float]]]:
        """動画からキーポイントを抽出して画像ファイルとして保存。
        
        Args:
            video_path: 動画ファイルのパス
            output_dir: 出力ディレクトリ
            max_keypoints: 抽出する最大キーポイント数
            frame_skip: フレームスキップ数（デフォルト30）
            max_frames: 保存する最大フレーム数（デフォルト50）
            
        Returns:
            Tuple[
                List[Tuple[int, str]]: all_frames - (フレーム番号, 保存パス)のリスト（スキップ間隔で保存された全フレーム）,
                List[Tuple[int, int, float]]: keypoints - (all_frames内のインデックス, フレーム番号, ハッシュ差分)のリスト
            ]
        """
        extraction_start = time.time()
        logger.info(f"🎯 Starting keypoint extraction from: {video_path}")
        logger.info(f"📁 Output directory: {output_dir}")
        
        # 出力ディレクトリを作成
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 動画を開く
        video_open_start = time.time()
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"動画ファイルを開けません: {video_path}")
        
        try:
            # 動画情報を取得
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            video_open_elapsed = time.time() - video_open_start
            logger.info(f"📊 Video info: {total_frames} frames, {fps:.2f} fps (video open: {video_open_elapsed:.2f}s)")
            logger.info(f"⚙️ Settings: threshold={self.threshold}, hash={self.hash_algorithm}, frame_skip={frame_skip}")
            
            all_frames: List[Tuple[int, str]] = []  # 全スキップフレーム
            frame_read_time = 0.0
            frame_save_time = 0.0
            hash_calc_time = 0.0
            keypoints: List[Tuple[int, int, float]] = []  # ハッシュで選ばれたキーポイント
            previous_hash = None
            last_keypoint_idx = -1
            frame_number = 0
            frame_idx = 0  # all_frames内のインデックス
            
            # 各フレームを処理（フレームスキップ対応）
            while frame_number < total_frames:
                # フレームスキップして次の処理対象フレームに移動
                read_start = time.time()
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                ret, frame = cap.read()
                frame_read_time += time.time() - read_start
                if not ret or frame is None:
                    frame_number += frame_skip
                    continue
                
                # フレームを保存（全スキップフレーム）
                save_start = time.time()
                timestamp_sec = frame_number / fps if fps > 0 else 0
                filename = f"frame_{frame_idx:04d}_{frame_number:06d}_{timestamp_sec:.2f}s.jpg"
                output_file = output_path / filename
                
                # 長辺が指定サイズに収まるようにリサイズ
                resized_frame = self._resize_frame_if_needed(frame)
                cv2.imwrite(str(output_file), resized_frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                all_frames.append((frame_number, str(output_file)))
                frame_save_time += time.time() - save_start
                
                # フレームのハッシュを計算
                hash_start = time.time()
                current_hash = self._calculate_frame_hash(frame)
                hash_calc_time += time.time() - hash_start
                
                # 最初のフレームは常にキーポイントとして追加
                if frame_idx == 0:
                    keypoints.append((frame_idx, frame_number, 0.0))
                    last_keypoint_idx = frame_idx
                    logger.info(f"✅ First keypoint: Frame {frame_number} (idx={frame_idx})")
                elif previous_hash is not None:
                    # max_keypointsの制限なしで全キーポイント候補を収集
                    hash_diff = current_hash - previous_hash
                    
                    # キーポイント判定（min_intervalはall_framesのインデックス差で判定）
                    is_keypoint = (
                        hash_diff >= self.threshold and
                        frame_idx - last_keypoint_idx >= 1  # 最低1フレームの間隔
                    )
                    
                    if is_keypoint:
                        keypoints.append((frame_idx, frame_number, float(hash_diff)))
                        last_keypoint_idx = frame_idx
                        
                        logger.info(
                            f"✅ Keypoint #{len(keypoints)}: Frame {frame_number} "
                            f"(idx={frame_idx}, {timestamp_sec:.2f}s) - Hash diff: {hash_diff:.1f}"
                        )
                
                previous_hash = current_hash
                frame_number += frame_skip
                frame_idx += 1
                
                # 進捗表示
                if frame_idx % 100 == 0:
                    progress = (frame_number / total_frames) * 100 if total_frames > 0 else 0
                    logger.info(f"📈 Progress: {progress:.1f}% ({frame_number}/{total_frames})")
            
            # 最後のフレームもキーポイントとして追加（まだリストにない場合）
            if len(all_frames) > 0 and last_keypoint_idx < len(all_frames) - 1:
                last_idx = len(all_frames) - 1
                keypoints.append((last_idx, all_frames[last_idx][0], 0.0))
                logger.info(f"✅ Last keypoint: Frame {all_frames[last_idx][0]} (idx={last_idx})")
            
            # max_keypointsを超えた場合、均等間隔でサンプリング
            if len(keypoints) > max_keypoints:
                logger.info(f"📊 Downsampling keypoints: {len(keypoints)} -> {max_keypoints} (evenly distributed)")
                
                # 最初と最後は必ず含める
                if max_keypoints >= 2:
                    # 中間のキーポイント数
                    middle_count = max_keypoints - 2
                    
                    if middle_count > 0 and len(keypoints) > 2:
                        # 最初と最後を除いた中間部分から均等にサンプリング
                        middle_keypoints = keypoints[1:-1]
                        step = len(middle_keypoints) / middle_count
                        sampled_middle = [middle_keypoints[int(i * step)] for i in range(middle_count)]
                        keypoints = [keypoints[0]] + sampled_middle + [keypoints[-1]]
                    else:
                        # middle_countが0の場合は最初と最後だけ
                        keypoints = [keypoints[0], keypoints[-1]]
                else:
                    # max_keypointsが1の場合は最初だけ
                    keypoints = [keypoints[0]]
                
                logger.info(f"✅ Downsampled to {len(keypoints)} keypoints (covering full video range)")
            
            extraction_elapsed = time.time() - extraction_start
            logger.info(f"🎉 Extraction complete! {len(all_frames)} frames saved, {len(keypoints)} keypoints selected")
            logger.info(
                f"⏱️ Timing breakdown: "
                f"total={extraction_elapsed:.2f}s, "
                f"frame_read={frame_read_time:.2f}s, "
                f"frame_save={frame_save_time:.2f}s, "
                f"hash_calc={hash_calc_time:.2f}s"
            )
            return all_frames, keypoints
            
        finally:
            cap.release()

    def analyze_hash_distribution(self, video_path: str, sample_frames: int = 1000, frame_skip: int = 30) -> dict:
        """動画のハッシュ差分分布を分析してパラメータ調整の参考情報を提供。
        
        Args:
            video_path: 動画ファイルのパス
            sample_frames: 分析するサンプルフレーム数
            frame_skip: フレームスキップ数（デフォルト30）
            
        Returns:
            分析結果を含む辞書
        """
        logger.info(f"📊 Analyzing hash distribution: {video_path}")
        logger.info(f"⚙️ Frame skip: {frame_skip} frames (analyzing every {frame_skip}th frame)")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"動画ファイルを開けません: {video_path}")
        
        try:
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # フレームスキップを考慮したサンプリング
            # 実際のフレーム間隔をframe_skip分だけ空けて分析
            hash_diffs = []
            previous_hash = None
            frame_count = 0
            
            # フレームスキップでサンプリング
            for i in range(0, total_frames, frame_skip):
                if frame_count >= sample_frames:
                    break
                    
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                
                if not ret or frame is None:
                    continue
                
                current_hash = self._calculate_frame_hash(frame)
                
                if previous_hash is not None:
                    diff = current_hash - previous_hash
                    hash_diffs.append(float(diff))
                
                previous_hash = current_hash
                frame_count += 1
                
                # 進捗表示（100サンプルごと）
                if frame_count % 100 == 0:
                    progress = (frame_count / sample_frames) * 100
                    logger.info(f"📈 Analysis progress: {progress:.1f}% ({frame_count}/{sample_frames})")
            
            # 統計情報を計算
            if hash_diffs:
                logger.info(f"📈 Analysis complete - {len(hash_diffs)} samples processed with frame_skip={frame_skip}")
                hash_array = np.array(hash_diffs)
                analysis = {
                    "total_samples": len(hash_diffs),
                    "mean_diff": float(np.mean(hash_array)),
                    "std_diff": float(np.std(hash_array)),
                    "min_diff": float(np.min(hash_array)),
                    "max_diff": float(np.max(hash_array)),
                    "percentiles": {
                        "50th": float(np.percentile(hash_array, 50)),
                        "75th": float(np.percentile(hash_array, 75)),
                        "90th": float(np.percentile(hash_array, 90)),
                        "95th": float(np.percentile(hash_array, 95)),
                        "99th": float(np.percentile(hash_array, 99)),
                    },
                    "recommended_thresholds": {
                        "conservative": float(np.percentile(hash_array, 90)),
                        "moderate": float(np.percentile(hash_array, 95)),
                        "aggressive": float(np.percentile(hash_array, 99)),
                    }
                }
                
                logger.info(f"📈 Analysis complete - Mean diff: {analysis['mean_diff']:.2f}")
                return analysis
            else:
                logger.warning("⚠️ No hash differences calculated")
                return {}
                
        finally:
            cap.release()


def extract_keypoints_from_video(
    video_path: str,
    output_dir: str | None = None,
    threshold: float | None = 5.0,
    max_keypoints: int = 10,
    hash_algorithm: str = "dhash",
    max_frames: int = 100
) -> Tuple[List[Tuple[int, str]], List[Tuple[int, int, float]]]:
    """動画からキーポイントを抽出する便利関数。
    
    Args:
        video_path: 動画ファイルのパス
        output_dir: 出力ディレクトリ（Noneの場合は動画ファイルと同じディレクトリに'keypoints'フォルダを作成）
        threshold: キーポイント判定の閾値（Noneの場合は自動調整）
        max_keypoints: 抽出する最大キーポイント数
        hash_algorithm: 使用するハッシュアルゴリズム
        frame_skip: フレームスキップ数（デフォルト120）
        max_frames: 保存する最大フレーム数（デフォルト50）
        
    Returns:
        Tuple[
            List[Tuple[int, str]]: all_frames - (フレーム番号, 保存パス)のリスト（スキップ間隔で保存された全フレーム）,
            List[Tuple[int, int, float]]: keypoints - (all_frames内のインデックス, フレーム番号, ハッシュ差分)のリスト
        ]
    """
    if output_dir is None:
        video_dir = Path(video_path).parent
        video_name = Path(video_path).stem
        output_dir = str(video_dir / f"{video_name}_keypoints")
    
    # max_framesに収まるようにframe_skipを動的に調整（最小20フレーム）
    min_frame_skip = 20
    cap = cv2.VideoCapture(video_path)
    frame_skip = min_frame_skip
    if cap.isOpened():
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()
        
        adjusted_frame_skip = max(min_frame_skip, (total_frames // max_frames) + 1)
        frame_skip = adjusted_frame_skip
    
    # thresholdがNoneの場合は自動調整
    if threshold is None:
        logger.info(f"📊 Auto-adjusting threshold for {video_path}")
        temp_extractor = KeypointExtractor(hash_algorithm=hash_algorithm)
        analysis = temp_extractor.analyze_hash_distribution(video_path, sample_frames=500, frame_skip=frame_skip)
        if analysis:
            threshold = analysis['recommended_thresholds']['moderate']
            logger.info(f"💡 Auto-adjusted threshold: {threshold}")
        else:
            threshold = 5.0  # フォールバック
            logger.warning(f"⚠️  Hash analysis failed, using fallback threshold: {threshold}")
    
    # thresholdは必ずfloatになっている
    final_threshold: float = threshold if threshold is not None else 5.0
    
    extractor = KeypointExtractor(
        threshold=final_threshold,
        hash_algorithm=hash_algorithm
    )
    
    return extractor.extract_keypoints(video_path, output_dir, max_keypoints, frame_skip)