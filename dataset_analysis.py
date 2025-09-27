#!/usr/bin/env python3
"""
PCB Dataset Analysis Script
This script analyzes the YOLO dataset and generates a comprehensive CSV report
with class statistics including total instances, distribution across splits, etc.
"""

import os
import pandas as pd
import yaml
from pathlib import Path
from collections import defaultdict, Counter
import csv

class YOLODatasetAnalyzer:
    def __init__(self, dataset_path):
        self.dataset_path = Path(dataset_path)
        self.data_yaml_path = self.dataset_path / "data.yaml"
        self.class_names = {}
        self.stats = defaultdict(lambda: defaultdict(int))
        
    def load_dataset_config(self):
        """Load the dataset configuration from data.yaml"""
        try:
            with open(self.data_yaml_path, 'r') as f:
                data_config = yaml.safe_load(f)
            
            self.class_names = data_config.get('names', {})
            print(f"📋 Loaded dataset configuration with {len(self.class_names)} classes")
            
            for class_id, class_name in self.class_names.items():
                print(f"   {class_id}: {class_name}")
                
            return True
        except Exception as e:
            print(f"❌ Error loading dataset config: {e}")
            return False
    
    def analyze_split(self, split_name):
        """Analyze a specific split (train/valid/test)"""
        print(f"\n🔍 Analyzing {split_name} split...")
        
        labels_path = self.dataset_path / split_name / "labels"
        images_path = self.dataset_path / split_name / "images"
        
        if not labels_path.exists():
            print(f"⚠️  Labels path not found: {labels_path}")
            return
        
        if not images_path.exists():
            print(f"⚠️  Images path not found: {images_path}")
            return
        
        # Get all label files
        label_files = list(labels_path.glob("*.txt"))
        image_files = list(images_path.glob("*.jpg")) + list(images_path.glob("*.jpeg")) + list(images_path.glob("*.png"))
        
        print(f"   📁 Found {len(label_files)} label files")
        print(f"   🖼️  Found {len(image_files)} image files")
        
        # Initialize counters for this split
        class_instances = Counter()
        images_with_class = Counter()
        total_images = len(image_files)
        images_with_annotations = 0
        
        # Analyze each label file
        for label_file in label_files:
            try:
                with open(label_file, 'r') as f:
                    lines = f.readlines()
                
                if lines:  # File has annotations
                    images_with_annotations += 1
                    classes_in_image = set()
                    
                    for line in lines:
                        line = line.strip()
                        if line:
                            parts = line.split()
                            if len(parts) >= 5:  # class_id x y w h
                                class_id = int(parts[0])
                                class_instances[class_id] += 1
                                classes_in_image.add(class_id)
                    
                    # Count images containing each class
                    for class_id in classes_in_image:
                        images_with_class[class_id] += 1
                        
            except Exception as e:
                print(f"   ❌ Error reading {label_file}: {e}")
        
        # Store statistics for this split
        self.stats[split_name]['total_images'] = total_images
        self.stats[split_name]['images_with_annotations'] = images_with_annotations
        self.stats[split_name]['images_without_annotations'] = total_images - images_with_annotations
        
        # Store class-specific statistics
        for class_id, class_name in self.class_names.items():
            self.stats[split_name][f'{class_name}_instances'] = class_instances.get(class_id, 0)
            self.stats[split_name][f'{class_name}_images'] = images_with_class.get(class_id, 0)
        
        print(f"   ✅ Analysis complete for {split_name}")
        print(f"      - Total instances: {sum(class_instances.values())}")
        print(f"      - Images with annotations: {images_with_annotations}")
        print(f"      - Images without annotations: {total_images - images_with_annotations}")
    
    def generate_summary_stats(self):
        """Generate overall summary statistics"""
        print(f"\n📊 Generating summary statistics...")
        
        # Calculate totals across all splits
        total_stats = defaultdict(int)
        splits = ['train', 'valid', 'test']
        
        for split in splits:
            if split in self.stats:
                for key, value in self.stats[split].items():
                    if key != 'total_images' and key != 'images_with_annotations' and key != 'images_without_annotations':
                        total_stats[key] += value
                    elif key == 'total_images':
                        total_stats['total_images_all_splits'] += value
                    elif key == 'images_with_annotations':
                        total_stats['total_images_with_annotations'] += value
                    elif key == 'images_without_annotations':
                        total_stats['total_images_without_annotations'] += value
        
        self.stats['total'] = dict(total_stats)
        
        # Calculate percentages and additional metrics
        for class_id, class_name in self.class_names.items():
            total_instances = total_stats.get(f'{class_name}_instances', 0)
            total_images_with_class = total_stats.get(f'{class_name}_images', 0)
            
            if total_stats['total_images_with_annotations'] > 0:
                percentage_of_annotated_images = (total_images_with_class / total_stats['total_images_with_annotations']) * 100
                self.stats['total'][f'{class_name}_percentage_of_annotated_images'] = round(percentage_of_annotated_images, 2)
            
            if total_images_with_class > 0:
                avg_instances_per_image = total_instances / total_images_with_class
                self.stats['total'][f'{class_name}_avg_instances_per_image'] = round(avg_instances_per_image, 2)
    
    def create_csv_report(self, output_file='dataset_analysis.csv'):
        """Create a comprehensive CSV report"""
        print(f"\n📝 Creating CSV report: {output_file}")
        
        # Prepare data for CSV
        rows = []
        
        # Overall dataset statistics
        rows.append(['DATASET OVERVIEW', '', '', '', '', '', ''])
        rows.append(['Metric', 'Value', '', '', '', '', ''])
        rows.append(['Total Classes', len(self.class_names), '', '', '', '', ''])
        rows.append(['Total Images (All Splits)', self.stats['total'].get('total_images_all_splits', 0), '', '', '', '', ''])
        rows.append(['Total Images with Annotations', self.stats['total'].get('total_images_with_annotations', 0), '', '', '', '', ''])
        rows.append(['Total Images without Annotations', self.stats['total'].get('total_images_without_annotations', 0), '', '', '', '', ''])
        rows.append(['', '', '', '', '', '', ''])
        
        # Class statistics summary
        rows.append(['CLASS STATISTICS SUMMARY', '', '', '', '', '', ''])
        rows.append(['Class Name', 'Total Instances', 'Total Images with Class', 'Percentage of Annotated Images', 'Avg Instances per Image', 'Train Instances', 'Valid Instances', 'Test Instances'])
        
        for class_id, class_name in self.class_names.items():
            total_instances = self.stats['total'].get(f'{class_name}_instances', 0)
            total_images = self.stats['total'].get(f'{class_name}_images', 0)
            percentage = self.stats['total'].get(f'{class_name}_percentage_of_annotated_images', 0)
            avg_per_image = self.stats['total'].get(f'{class_name}_avg_instances_per_image', 0)
            
            train_instances = self.stats.get('train', {}).get(f'{class_name}_instances', 0)
            valid_instances = self.stats.get('valid', {}).get(f'{class_name}_instances', 0)
            test_instances = self.stats.get('test', {}).get(f'{class_name}_instances', 0)
            
            rows.append([
                class_name,
                total_instances,
                total_images,
                f"{percentage}%",
                avg_per_image,
                train_instances,
                valid_instances,
                test_instances
            ])
        
        rows.append(['', '', '', '', '', '', ''])
        
        # Detailed split statistics
        for split in ['train', 'valid', 'test']:
            if split in self.stats:
                rows.append([f'{split.upper()} SPLIT DETAILS', '', '', '', '', '', ''])
                rows.append(['Metric', 'Value', '', '', '', '', ''])
                rows.append(['Total Images', self.stats[split].get('total_images', 0), '', '', '', '', ''])
                rows.append(['Images with Annotations', self.stats[split].get('images_with_annotations', 0), '', '', '', '', ''])
                rows.append(['Images without Annotations', self.stats[split].get('images_without_annotations', 0), '', '', '', '', ''])
                rows.append(['', '', '', '', '', '', ''])
                
                rows.append(['Class', 'Instances', 'Images with Class', '', '', '', ''])
                for class_id, class_name in self.class_names.items():
                    instances = self.stats[split].get(f'{class_name}_instances', 0)
                    images = self.stats[split].get(f'{class_name}_images', 0)
                    rows.append([class_name, instances, images, '', '', '', ''])
                rows.append(['', '', '', '', '', '', ''])
        
        # Write to CSV
        output_path = self.dataset_path / output_file
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(rows)
        
        print(f"✅ CSV report saved to: {output_path}")
        
        # Also create a simple summary CSV for easy reading
        summary_file = 'dataset_summary.csv'
        summary_path = self.dataset_path / summary_file
        
        with open(summary_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Class Name', 'Total Instances', 'Train Instances', 'Valid Instances', 'Test Instances', 'Total Images with Class', 'Percentage of Dataset'])
            
            for class_id, class_name in self.class_names.items():
                total_instances = self.stats['total'].get(f'{class_name}_instances', 0)
                train_instances = self.stats.get('train', {}).get(f'{class_name}_instances', 0)
                valid_instances = self.stats.get('valid', {}).get(f'{class_name}_instances', 0)
                test_instances = self.stats.get('test', {}).get(f'{class_name}_instances', 0)
                total_images = self.stats['total'].get(f'{class_name}_images', 0)
                percentage = self.stats['total'].get(f'{class_name}_percentage_of_annotated_images', 0)
                
                writer.writerow([
                    class_name,
                    total_instances,
                    train_instances,
                    valid_instances,
                    test_instances,
                    total_images,
                    f"{percentage}%"
                ])
        
        print(f"✅ Summary CSV saved to: {summary_path}")
        return output_path, summary_path
    
    def print_console_summary(self):
        """Print a summary to console"""
        print(f"\n" + "="*70)
        print(f"📊 PCB DATASET ANALYSIS SUMMARY")
        print(f"="*70)
        
        print(f"\n🗂️  DATASET OVERVIEW:")
        print(f"   Total Classes: {len(self.class_names)}")
        print(f"   Total Images: {self.stats['total'].get('total_images_all_splits', 0)}")
        print(f"   Images with Annotations: {self.stats['total'].get('total_images_with_annotations', 0)}")
        
        print(f"\n🏷️  CLASS INSTANCES (Total across all splits):")
        total_all_instances = 0
        for class_id, class_name in self.class_names.items():
            instances = self.stats['total'].get(f'{class_name}_instances', 0)
            total_all_instances += instances
            print(f"   {class_name:12}: {instances:6,} instances")
        
        print(f"\n📈 TOTAL DATASET INSTANCES: {total_all_instances:,}")
        print(f"="*70)

def main():
    """Main function to run the dataset analysis"""
    print("🚀 Starting PCB Dataset Analysis...")
    
    # Initialize analyzer
    dataset_path = "DATASET"
    analyzer = YOLODatasetAnalyzer(dataset_path)
    
    # Load dataset configuration
    if not analyzer.load_dataset_config():
        return
    
    # Analyze each split
    splits_to_analyze = ['train', 'valid', 'test']
    for split in splits_to_analyze:
        if (Path(dataset_path) / split).exists():
            analyzer.analyze_split(split)
        else:
            print(f"⚠️  Skipping {split} - directory not found")
    
    # Generate summary statistics
    analyzer.generate_summary_stats()
    
    # Create CSV reports
    detailed_csv, summary_csv = analyzer.create_csv_report()
    
    # Print console summary
    analyzer.print_console_summary()
    
    print(f"\n🎉 Analysis complete!")
    print(f"📁 Files created:")
    print(f"   - Detailed report: {detailed_csv}")
    print(f"   - Summary report: {summary_csv}")

if __name__ == "__main__":
    main()