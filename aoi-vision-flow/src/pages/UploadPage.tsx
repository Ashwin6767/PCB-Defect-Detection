import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileImage, CheckCircle, Video, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const UploadPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState<'images' | 'video'>('images');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear all previous session data on component mount
  useEffect(() => {
    sessionStorage.removeItem('uploadedFiles');
    sessionStorage.removeItem('inspectionResults');
    // Call backend to clear old files
    fetch('http://localhost:5000/api/cleanup', { method: 'POST' }).catch(() => {
      // Ignore cleanup errors - backend might be offline
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      if (uploadMode === 'images') {
        return file.type.startsWith('image/');
      } else {
        return file.type.startsWith('video/');
      }
    });
    
    if (droppedFiles.length > 0) {
      if (uploadMode === 'video' && droppedFiles.length > 1) {
        toast({
          title: "Multiple videos not supported",
          description: "Please upload one video at a time",
          variant: "destructive",
        });
        return;
      }
      
      setFiles(uploadMode === 'video' ? [droppedFiles[0]] : prev => [...prev, ...droppedFiles]);
      toast({
        title: "Files uploaded successfully",
        description: `${droppedFiles.length} PCB ${uploadMode === 'video' ? 'video' : 'image(s)'} ready for inspection`,
      });
    }
  }, [toast, uploadMode]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      if (uploadMode === 'video' && selectedFiles.length > 1) {
        toast({
          title: "Multiple videos not supported",
          description: "Please upload one video at a time",
          variant: "destructive",
        });
        return;
      }
      
      setFiles(uploadMode === 'video' ? [selectedFiles[0]] : prev => [...prev, ...selectedFiles]);
      toast({
        title: "Files selected",
        description: `${selectedFiles.length} PCB ${uploadMode === 'video' ? 'video' : 'image(s)'} ready for inspection`,
      });
    }
  };

  const startInspection = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: `Please upload PCB ${uploadMode} before starting inspection`,
        variant: "destructive",
      });
      return;
    }
    
    // Store files and mode for inspection page
    sessionStorage.setItem('uploadedFiles', JSON.stringify(files.map(f => f.name)));
    sessionStorage.setItem('uploadMode', uploadMode);
    
    try {
      const formData = new FormData();
      
      if (uploadMode === 'video') {
        // Process video
        formData.append('video', files[0]);
        
        toast({
          title: "Processing Video",
          description: "Uploading and processing video with YOLOv10 (sampling every 700ms)...",
        });
        
        const response = await fetch('http://localhost:5000/api/inspect-video', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Video processing result:', data);
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          // Video processing now returns multiple results (summary + individual frames)
          sessionStorage.setItem('inspectionResults', JSON.stringify(data.results));
          
          setFiles([]);
          
          toast({
            title: "Video Processing Complete",
            description: `PCB video processed - ${data.results.length} results generated`,
          });
          
          navigate('/inspection');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Video processing failed:', errorData);
          throw new Error(errorData.error || 'Video processing failed');
        }
      } else {
        // Process images
        files.forEach((file) => {
          formData.append('images', file);
        });
        
        const response = await fetch('http://localhost:5000/api/inspect-batch', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          sessionStorage.setItem('inspectionResults', JSON.stringify(data.results));
          
          setFiles([]);
          
          toast({
            title: "Processing Complete",
            description: `${files.length} PCB images processed with YOLOv10`,
          });
          
          navigate('/inspection');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Image processing failed');
        }
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: `Error: ${error.message}. Using demo mode instead.`,
        variant: "destructive",
      });
      
      // Create demo video results for fallback (summary + individual frames)
      if (uploadMode === 'video') {
        const demoVideoResults = [
          // Summary result with video file
          {
            pcbId: 'DEMO-VIDEO-001-SUMMARY',
            videoId: 'DEMO-VIDEO-001',
            status: 'FAIL' as const,
            defectType: 'Video Summary - Multiple Defects',
            metrics: {
              total_frames: 120,
              processed_frames: 17,
              frames_with_defects: 5,
              total_defects: 12,
              defect_density: 0.294,
              duration_seconds: 4.0,
              fps: 30.0,
              processing_interval_ms: 700,
              frame_interval: 7
            },
            files: {
              original: 'demo_original.mp4',
              processed: 'demo_processed.mp4'
            }
          },
          // Individual frame results
          {
            pcbId: 'DEMO-VIDEO-001-F0015',
            videoId: 'DEMO-VIDEO-001',
            frameNumber: 15,
            timestamp_seconds: 0.5,
            status: 'FAIL' as const,
            defectType: 'Spur',
            metrics: { total_defects: 1, frame_number: 15, video_timestamp: 0.5 },
            defects_detected: [{ type: 'spur', confidence: 0.85, bbox: [100, 100, 150, 150], area: 2500 }]
          },
          {
            pcbId: 'DEMO-VIDEO-001-F0045',
            videoId: 'DEMO-VIDEO-001',
            frameNumber: 45,
            timestamp_seconds: 1.5,
            status: 'FAIL' as const,
            defectType: 'Short Circuit',
            metrics: { total_defects: 2, frame_number: 45, video_timestamp: 1.5 },
            defects_detected: [
              { type: 'shortcircuit', confidence: 0.92, bbox: [200, 200, 250, 250], area: 2500 },
              { type: 'spur', confidence: 0.76, bbox: [180, 180, 220, 220], area: 1600 }
            ]
          },
          {
            pcbId: 'DEMO-VIDEO-001-F0075',
            videoId: 'DEMO-VIDEO-001',
            frameNumber: 75,
            timestamp_seconds: 2.5,
            status: 'QUESTIONABLE' as const,
            defectType: 'Pin Hole',
            metrics: { total_defects: 1, frame_number: 75, video_timestamp: 2.5 },
            defects_detected: [{ type: 'pinhole', confidence: 0.78, bbox: [150, 150, 200, 200], area: 2500 }]
          }
        ];
        sessionStorage.setItem('inspectionResults', JSON.stringify(demoVideoResults));
      }
      
      navigate('/inspection');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              AOI Inspector
            </h1>
            <h2 className="text-3xl font-semibold text-primary mb-6">
              Upload PCB {uploadMode === 'video' ? 'Video' : 'Images'} for Inspection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Drag and drop your PCB {uploadMode} below or click to browse. Our advanced optical inspection 
              system will analyze each {uploadMode === 'video' ? 'frame' : 'board'} for defects and quality issues.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex justify-center mb-8 animate-fade-in-up">
            <div className="industrial-card p-2 flex rounded-xl">
              <Button
                variant={uploadMode === 'images' ? 'default' : 'ghost'}
                onClick={() => {
                  setUploadMode('images');
                  setFiles([]);
                }}
                className="flex items-center px-6 py-3 rounded-lg"
              >
                <Image className="mr-2" size={20} />
                Images
              </Button>
              <Button
                variant={uploadMode === 'video' ? 'default' : 'ghost'}
                onClick={() => {
                  setUploadMode('video');
                  setFiles([]);
                }}
                className="flex items-center px-6 py-3 rounded-lg"
              >
                <Video className="mr-2" size={20} />
                Video
              </Button>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="animate-fade-in-up animate-stagger-1">
            <div
              className={`upload-zone p-12 text-center cursor-pointer min-h-[400px] flex flex-col items-center justify-center ${
                isDragOver ? 'border-primary bg-primary/5' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="mb-6">
                <Upload 
                  size={80} 
                  className={`mx-auto mb-4 transition-colors duration-300 ${
                    isDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                />
                {uploadMode === 'video' ? (
                  <Video 
                    size={60} 
                    className={`mx-auto transition-colors duration-300 ${
                      isDragOver ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                ) : (
                  <FileImage 
                    size={60} 
                    className={`mx-auto transition-colors duration-300 ${
                      isDragOver ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                )}
              </div>
              
              <h3 className="text-2xl font-semibold mb-4 text-foreground">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </h3>
              
              <p className="text-lg text-muted-foreground mb-6">
                or <span className="text-primary font-medium">click to browse</span>
              </p>
              
              <div className="text-sm text-muted-foreground space-y-1">
                {uploadMode === 'video' ? (
                  <>
                    <p>Supported formats: MP4, AVI, MOV, WEBM</p>
                    <p>Maximum file size: 100MB per video</p>
                    <p>One video at a time</p>
                  </>
                ) : (
                  <>
                    <p>Supported formats: JPG, PNG, WEBP</p>
                    <p>Maximum file size: 20MB per image</p>
                  </>
                )}
              </div>
              
              <input
                id="file-input"
                type="file"
                multiple={uploadMode === 'images'}
                accept={uploadMode === 'video' ? 'video/*' : 'image/*'}
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>

          {/* Uploaded Files Display */}
          {files.length > 0 && (
            <div className="mt-8 animate-fade-in-up animate-stagger-2">
              <div className="industrial-card p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircle className="mr-2 text-success" size={24} />
                  Uploaded Files ({files.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                      {uploadMode === 'video' ? (
                        <Video className="mr-3 text-primary flex-shrink-0" size={20} />
                      ) : (
                        <FileImage className="mr-3 text-primary flex-shrink-0" size={20} />
                      )}
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Start Inspection Button */}
          <div className="mt-12 text-center animate-fade-in-up animate-stagger-3">
            <Button
              onClick={startInspection}
              size="lg"
              className="btn-primary px-12 py-4 text-lg font-semibold rounded-xl"
            >
              Start Inspection
              <Upload className="ml-2" size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;