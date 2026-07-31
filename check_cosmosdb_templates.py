import os
import json
from azure.cosmos import CosmosClient, exceptions
from azure.identity import DefaultAzureCredential

# Cosmos DB設定
cosmos_endpoint = "https://cosno-genashi-trial-96.documents.azure.com:443/"
database_name = "cosmos-genashi-trial-01"
container_name = "template"
source_folder = r"C:\Users\71188700\Downloads\プロンプトテンプレート\プロンプトテンプレート"

# Azure AD認証を使用
credential = DefaultAzureCredential()

try:
    # Cosmos DBクライアントの初期化
    print("Connecting to Cosmos DB...")
    client = CosmosClient(cosmos_endpoint, credential)
    database = client.get_database_client(database_name)
    container = database.get_container_client(container_name)
    print("Connected successfully!\n")
    
    # Cosmos DBから既存のIDを取得
    print("Fetching existing templates from Cosmos DB...")
    query = "SELECT c.id FROM c"
    existing_ids = set()
    
    for item in container.query_items(query=query, enable_cross_partition_query=True):
        existing_ids.add(item['id'])
    
    print(f"Found {len(existing_ids)} existing templates in Cosmos DB\n")
    
    # ローカルのJSONファイルからIDを取得
    print("Checking local JSON files...")
    json_files = sorted([f for f in os.listdir(source_folder) if f.endswith('.json')])
    
    local_ids = []
    file_summary = []
    
    for filename in json_files:
        file_path = os.path.join(source_folder, filename)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                ids_in_file = [item['id'] for item in data if 'id' in item]
                local_ids.extend(ids_in_file)
                
                # このファイルの既存/新規チェック
                existing_in_file = [id for id in ids_in_file if id in existing_ids]
                new_in_file = [id for id in ids_in_file if id not in existing_ids]
                
                file_summary.append({
                    'filename': filename,
                    'total': len(ids_in_file),
                    'existing': len(existing_in_file),
                    'new': len(new_in_file),
                    'existing_ids': existing_in_file,
                    'new_ids': new_in_file
                })
        except Exception as e:
            print(f"Error reading {filename}: {str(e)}")
    
    print(f"\n{'='*80}")
    print(f"SUMMARY")
    print(f"{'='*80}")
    print(f"Total existing templates in Cosmos DB: {len(existing_ids)}")
    print(f"Total templates in local files: {len(local_ids)}")
    print(f"\n{'='*80}")
    print(f"FILE DETAILS")
    print(f"{'='*80}\n")
    
    total_new = 0
    total_existing = 0
    
    for summary in file_summary:
        print(f"📄 {summary['filename']}")
        print(f"   Total items: {summary['total']}")
        print(f"   Already in DB: {summary['existing']}")
        print(f"   New items: {summary['new']}")
        
        if summary['existing'] > 0:
            print(f"   Existing IDs: {', '.join(summary['existing_ids'][:5])}" + 
                  (f"... (+{len(summary['existing_ids'])-5} more)" if len(summary['existing_ids']) > 5 else ""))
        
        if summary['new'] > 0:
            print(f"   New IDs: {', '.join(summary['new_ids'][:5])}" + 
                  (f"... (+{len(summary['new_ids'])-5} more)" if len(summary['new_ids']) > 5 else ""))
        
        print()
        
        total_new += summary['new']
        total_existing += summary['existing']
    
    print(f"{'='*80}")
    print(f"RESULT")
    print(f"{'='*80}")
    print(f"✓ Already in database: {total_existing} items")
    print(f"➕ New items to upload: {total_new} items")
    print(f"{'='*80}\n")
    
    if total_new > 0:
        print(f"⚠️  There are {total_new} new items that can be uploaded.")
    else:
        print(f"✅ All templates are already in the database. No upload needed.")
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
