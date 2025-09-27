#!/usr/bin/env python3
"""
Quick PCB Dataset Search and Download
Specific URLs and commands to get good PCB datasets quickly
"""

def immediate_dataset_sources():
    """Most promising immediate sources"""
    
    sources = [
        {
            "name": "Roboflow PCB Defect Datasets",
            "url": "https://universe.roboflow.com/search?q=pcb",
            "action": "Search 'PCB' -> Look for datasets with 'normal' samples",
            "expected_images": "2000-8000 per dataset",
            "format": "YOLO ready",
            "effort": "5 minutes"
        },
        
        {
            "name": "Kaggle PCB Competition Data",
            "url": "https://www.kaggle.com/datasets/akhatova/pcb-defects",
            "action": "Download directly",
            "expected_images": "~3000 images",
            "format": "Various",
            "effort": "10 minutes"
        },
        
        {
            "name": "DeepPCB (GitHub)",
            "url": "https://github.com/tangsanli5201/DeepPCB/releases",
            "action": "Download latest release",
            "expected_images": "1700 images with normal samples",  
            "format": "Pre-labeled",
            "effort": "15 minutes"
        },
        
        {
            "name": "Open Images PCB",
            "url": "https://storage.googleapis.com/openimages/web/download_v7.html",
            "action": "Use OIDv4 toolkit to download 'Circuit board' class",
            "expected_images": "500-1500 good PCBs",
            "format": "Need processing",
            "effort": "30 minutes"
        }
    ]
    
    return sources

def create_quick_download_commands():
    """Terminal commands to quickly download datasets"""
    
    commands = """
    🚀 QUICK DOWNLOAD COMMANDS
    ==========================
    
    1. INSTALL TOOLS:
    pip install roboflow kaggle oidv4-toolkit
    
    2. ROBOFLOW (Replace YOUR_API_KEY):
    python -c "
    from roboflow import Roboflow
    rf = Roboflow(api_key='YOUR_API_KEY')
    project = rf.workspace('public').project('pcb-defects')
    dataset = project.version(1).download('yolov8')
    "
    
    3. KAGGLE (Setup kaggle.json first):
    kaggle datasets download -d akhatova/pcb-defects
    unzip pcb-defects.zip
    
    4. GITHUB DIRECT:
    git clone https://github.com/tangsanli5201/DeepPCB.git
    
    5. OPEN IMAGES:
    python -m oidv4.downloader --classes "Circuit board" --type_csv all --limit 2000
    """
    
    return commands

def dataset_combination_strategy():
    """Strategy to combine multiple datasets to reach 3500+ good PCBs"""
    
    strategy = """
    📊 COMBINATION STRATEGY FOR 3500+ GOOD PCBs
    ===========================================
    
    TARGET: 3500 good PCB images
    
    SOURCE BREAKDOWN:
    - Roboflow datasets: ~1500 good PCBs
    - Kaggle PCB datasets: ~800 good PCBs  
    - DeepPCB normal samples: ~400 good PCBs
    - Open Images circuit boards: ~500 good PCBs
    - Synthetic generation: ~300 good PCBs
    
    TOTAL: ~3500 good PCBs
    
    QUALITY ASSURANCE:
    1. Manual review of downloaded images
    2. Remove any with visible defects
    3. Ensure variety in:
       - PCB sizes/types
       - Component density
       - Colors (green, blue, red solder mask)
       - Lighting conditions
    
    ORGANIZATION:
    - 2800 for training (80%)
    - 700 for validation (20%)
    - Create empty .txt label files for all
    """
    
    return strategy

def main():
    print("🎯 IMMEDIATE PCB DATASET ACQUISITION PLAN")
    print("="*50)
    
    sources = immediate_dataset_sources()
    for i, source in enumerate(sources, 1):
        print(f"\n{i}. {source['name']}")
        print(f"   URL: {source['url']}")
        print(f"   Action: {source['action']}")
        print(f"   Expected: {source['expected_images']}")
        print(f"   Time: {source['effort']}")
    
    print(f"\n{create_quick_download_commands()}")
    print(f"\n{dataset_combination_strategy()}")
    
    print("\n🏃‍♂️ START WITH:")
    print("1. Create free Roboflow account")
    print("2. Search for PCB datasets")
    print("3. Download 2-3 largest datasets")
    print("4. Filter for good/normal samples")
    print("5. Combine and organize")

if __name__ == "__main__":
    main()