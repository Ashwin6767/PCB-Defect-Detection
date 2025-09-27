#!/usr/bin/env python3
"""
PCB Dataset Per-Image Analysis Script
This script creates detailed CSV files showing per-image statistics with instance counts
for each class in every image. Creates separate files for train, validation, and combined.
"""

import os
import pandas as pd
import yaml
from pathlib import Path
from collections import defaultdict
import csv

class PerImageAnalyzer:
    def __init__(self, dataset_path):
        self.dataset_path = Path(dataset_path)
        self.data_yaml_path = self.dataset_path / "data.yaml"
        self.class_names = {}
        self.image_data = defaultdict(list)
        
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
    
    def analyze_split_images(self, split_name):
        """Analyze each image in a specific split"""
        print(f"\n🔍 Analyzing {split_name} split images...")
        
        labels_path = self.dataset_path / split_name / "labels"
        images_path = self.dataset_path / split_name / "images"
        
        if not labels_path.exists() or not images_path.exists():
            print(f"⚠️  Skipping {split_name} - paths not found")
            return []
        
        # Get all image files
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        image_files = []
        for ext in image_extensions:
            image_files.extend(list(images_path.glob(f"*{ext}")))
            image_files.extend(list(images_path.glob(f"*{ext.upper()}")))
        
        print(f"   📁 Found {len(image_files)} image files")
        
        split_data = []
        processed_count = 0
        
        for image_file in image_files:
            # Get corresponding label file
            label_file = labels_path / (image_file.stem + '.txt')
            
            # Initialize class counts for this image
            image_row = {
                'image_id': image_file.name,
                'split': split_name,
                'has_annotations': 'No'
            }
            
            # Initialize all class counts to 0
            for class_id, class_name in self.class_names.items():
                image_row[class_name] = 0
            
            # Count instances if label file exists
            if label_file.exists():
                try:
                    with open(label_file, 'r') as f:
                        lines = f.readlines()
                    
                    if lines:  # File has annotations
                        image_row['has_annotations'] = 'Yes'
                        
                        for line in lines:
                            line = line.strip()
                            if line:
                                parts = line.split()
                                if len(parts) >= 5:  # class_id x y w h
                                    class_id = int(parts[0])
                                    if class_id in self.class_names:
                                        class_name = self.class_names[class_id]
                                        image_row[class_name] += 1
                                        
                except Exception as e:
                    print(f"   ❌ Error reading {label_file}: {e}")
            
            # Calculate total instances for this image
            total_instances = sum(image_row[class_name] for class_name in self.class_names.values())
            image_row['total_instances'] = total_instances
            
            split_data.append(image_row)
            processed_count += 1
            
            if processed_count % 500 == 0:
                print(f"   📊 Processed {processed_count} images...")
        
        print(f"   ✅ Completed analysis of {len(split_data)} images in {split_name}")
        return split_data
    
    def create_csv_files(self):
        """Create CSV files for each split and combined"""
        print(f"\n📝 Creating per-image CSV files...")
        
        all_data = []
        splits_to_analyze = ['train', 'valid']
        
        # Analyze each split
        for split in splits_to_analyze:
            if (self.dataset_path / split).exists():
                split_data = self.analyze_split_images(split)
                if split_data:
                    all_data.extend(split_data)
                    self.save_split_csv(split_data, split)
        
        # Create combined CSV
        if all_data:
            self.save_combined_csv(all_data)
        
        # Create summary statistics
        self.create_summary_statistics(all_data)
    
    def save_split_csv(self, data, split_name):
        """Save CSV file for a specific split"""
        if not data:
            return
            
        filename = f"{split_name}_per_image_analysis.csv"
        filepath = self.dataset_path / filename
        
        # Define column order
        columns = ['image_id', 'split', 'has_annotations', 'total_instances']
        columns.extend([class_name for class_name in self.class_names.values()])
        
        # Create DataFrame and save
        df = pd.DataFrame(data)
        df = df[columns]  # Reorder columns
        df.to_csv(filepath, index=False)
        
        print(f"   ✅ Saved {split_name} analysis: {filepath}")
        print(f"      - {len(data)} images analyzed")
        
        # Print some statistics
        images_with_annotations = len([row for row in data if row['has_annotations'] == 'Yes'])
        total_instances = sum(row['total_instances'] for row in data)
        
        print(f"      - {images_with_annotations} images with annotations")
        print(f"      - {total_instances} total instances")
    
    def save_combined_csv(self, all_data):
        """Save combined CSV file with all splits"""
        filename = "combined_per_image_analysis.csv"
        filepath = self.dataset_path / filename
        
        # Define column order
        columns = ['image_id', 'split', 'has_annotations', 'total_instances']
        columns.extend([class_name for class_name in self.class_names.values()])
        
        # Create DataFrame and save
        df = pd.DataFrame(all_data)
        df = df[columns]  # Reorder columns
        df.to_csv(filepath, index=False)
        
        print(f"\n✅ Saved combined analysis: {filepath}")
        print(f"   - {len(all_data)} total images analyzed")
        
        # Print overall statistics
        images_with_annotations = len([row for row in all_data if row['has_annotations'] == 'Yes'])
        total_instances = sum(row['total_instances'] for row in all_data)
        
        print(f"   - {images_with_annotations} images with annotations")
        print(f"   - {total_instances} total instances")
        
        # Split breakdown
        train_count = len([row for row in all_data if row['split'] == 'train'])
        valid_count = len([row for row in all_data if row['split'] == 'valid'])
        
        print(f"   - {train_count} train images")
        print(f"   - {valid_count} validation images")
    
    def create_summary_statistics(self, all_data):
        """Create summary statistics CSV"""
        print(f"\n📊 Creating summary statistics...")
        
        filename = "per_image_summary_stats.csv"
        filepath = self.dataset_path / filename
        
        summary_data = []
        
        # Overall statistics
        summary_data.append(['OVERALL STATISTICS', '', '', '', ''])
        summary_data.append(['Metric', 'Value', 'Train', 'Valid', 'Combined'])
        
        train_data = [row for row in all_data if row['split'] == 'train']
        valid_data = [row for row in all_data if row['split'] == 'valid']
        
        # Basic counts
        summary_data.append(['Total Images', '', len(train_data), len(valid_data), len(all_data)])
        summary_data.append(['Images with Annotations', '', 
                           len([r for r in train_data if r['has_annotations'] == 'Yes']),
                           len([r for r in valid_data if r['has_annotations'] == 'Yes']),
                           len([r for r in all_data if r['has_annotations'] == 'Yes'])])
        
        summary_data.append(['Total Instances', '',
                           sum(r['total_instances'] for r in train_data),
                           sum(r['total_instances'] for r in valid_data),
                           sum(r['total_instances'] for r in all_data)])
        
        summary_data.append(['', '', '', '', ''])
        
        # Per-class statistics
        summary_data.append(['CLASS STATISTICS', '', '', '', ''])
        summary_data.append(['Class Name', 'Total Instances', 'Train Instances', 'Valid Instances', 'Images with Class'])
        
        for class_name in self.class_names.values():
            train_instances = sum(row[class_name] for row in train_data)
            valid_instances = sum(row[class_name] for row in valid_data)
            total_instances = train_instances + valid_instances
            images_with_class = len([row for row in all_data if row[class_name] > 0])
            
            summary_data.append([class_name, total_instances, train_instances, valid_instances, images_with_class])
        
        summary_data.append(['', '', '', '', ''])
        
        # Distribution statistics
        summary_data.append(['DISTRIBUTION STATISTICS', '', '', '', ''])
        summary_data.append(['Class Name', 'Min per Image', 'Max per Image', 'Avg per Image', 'Images with 0 instances'])
        
        for class_name in self.class_names.values():
            class_counts = [row[class_name] for row in all_data]
            non_zero_counts = [count for count in class_counts if count > 0]
            
            min_count = min(class_counts) if class_counts else 0
            max_count = max(class_counts) if class_counts else 0
            avg_count = sum(non_zero_counts) / len(non_zero_counts) if non_zero_counts else 0
            zero_count = len([count for count in class_counts if count == 0])
            
            summary_data.append([class_name, min_count, max_count, f"{avg_count:.2f}", zero_count])
        
        # Save summary
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(summary_data)
        
        print(f"✅ Saved summary statistics: {filepath}")
    
    def print_sample_data(self, all_data, num_samples=10):
        """Print sample data to console"""
        print(f"\n📋 SAMPLE DATA (First {num_samples} images):")
        print("="*100)
        
        # Print header
        header = f"{'Image ID':<40} {'Split':<6} {'Ann':<4} {'Total':<6}"
        for class_name in self.class_names.values():
            header += f"{class_name[:8]:<9}"
        print(header)
        print("-"*100)
        
        # Print sample rows
        for i, row in enumerate(all_data[:num_samples]):
            line = f"{row['image_id'][:39]:<40} {row['split']:<6} {row['has_annotations'][:3]:<4} {row['total_instances']:<6}"
            for class_name in self.class_names.values():
                line += f"{row[class_name]:<9}"
            print(line)
        
        if len(all_data) > num_samples:
            print(f"... and {len(all_data) - num_samples} more images")
        
        print("="*100)

def main():
    """Main function to run the per-image analysis"""
    print("🚀 Starting PCB Dataset Per-Image Analysis...")
    
    # Initialize analyzer
    dataset_path = "DATASET"
    analyzer = PerImageAnalyzer(dataset_path)
    
    # Load dataset configuration
    if not analyzer.load_dataset_config():
        return
    
    # Create CSV files
    analyzer.create_csv_files()
    
    print(f"\n🎉 Per-image analysis complete!")
    print(f"📁 Files created in {dataset_path}/:")
    print(f"   - train_per_image_analysis.csv")
    print(f"   - valid_per_image_analysis.csv") 
    print(f"   - combined_per_image_analysis.csv")
    print(f"   - per_image_summary_stats.csv")
    
    print(f"\n💡 Each CSV contains:")
    print(f"   - image_id: filename of the image")
    print(f"   - split: train/valid")
    print(f"   - has_annotations: Yes/No")
    print(f"   - total_instances: total defects in image")
    print(f"   - Individual class counts for each defect type")

if __name__ == "__main__":
    main()