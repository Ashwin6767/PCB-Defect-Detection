import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import { 
  CloudUpload as Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  VideoFile as Video,
  PhotoLibrary as Image 
} from '@mui/icons-material';
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
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0E1A 0%, #1E293B 25%, #0F172A 50%, #1E40AF 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Box sx={{ maxWidth: '4xl', mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h1" sx={{ mb: 2, fontWeight: 700 }}>
              AOI Inspector
            </Typography>
            <Typography variant="h3" color="primary" sx={{ mb: 3, fontWeight: 600 }}>
              Upload PCB {uploadMode === 'video' ? 'Video' : 'Images'} for Inspection
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Drag and drop your PCB {uploadMode} below or click to browse. Our advanced optical inspection 
              system will analyze each {uploadMode === 'video' ? 'frame' : 'board'} for defects and quality issues.
            </Typography>
          </Box>

          {/* Mode Selector */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
            <Card sx={{ 
              p: 1, 
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(17, 24, 39, 0.8)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <ToggleButtonGroup
                value={uploadMode}
                exclusive
                onChange={(_, newMode) => {
                  if (newMode) {
                    setUploadMode(newMode);
                    setFiles([]);
                  }
                }}
                sx={{ gap: 1 }}
              >
                <ToggleButton value="images" sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Image />
                  Images
                </ToggleButton>
                <ToggleButton value="video" sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Video />
                  Video
                </ToggleButton>
              </ToggleButtonGroup>
            </Card>
          </Box>

          {/* Upload Zone */}
          <Card 
            sx={{ 
              minHeight: 400,
              border: isDragOver ? '2px dashed' : '2px dashed',
              borderColor: isDragOver ? 'primary.main' : 'rgba(59, 130, 246, 0.3)',
              bgcolor: isDragOver ? 'rgba(59, 130, 246, 0.1)' : 'rgba(17, 24, 39, 0.6)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'rgba(59, 130, 246, 0.1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2)'
              }
            }}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: 400,
              textAlign: 'center',
              p: 6
            }}>
              <Box sx={{ mb: 4 }}>
                <Upload 
                  sx={{ 
                    fontSize: 80, 
                    mb: 2,
                    color: isDragOver ? 'primary.main' : 'text.secondary',
                    transition: 'color 0.3s ease'
                  }} 
                />
                {uploadMode === 'video' ? (
                  <Video 
                    sx={{ 
                      fontSize: 60,
                      color: isDragOver ? 'primary.main' : 'text.secondary',
                      transition: 'color 0.3s ease'
                    }} 
                  />
                ) : (
                  <ImageIcon 
                    sx={{ 
                      fontSize: 60,
                      color: isDragOver ? 'primary.main' : 'text.secondary',
                      transition: 'color 0.3s ease'
                    }} 
                  />
                )}
              </Box>
              
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </Typography>
              
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                or <Typography component="span" color="primary" sx={{ fontWeight: 500 }}>click to browse</Typography>
              </Typography>
              
              <Box sx={{ color: 'text.secondary' }}>
                {uploadMode === 'video' ? (
                  <Box>
                    <Typography variant="body2">Supported formats: MP4, AVI, MOV, WEBM</Typography>
                    <Typography variant="body2">Maximum file size: 100MB per video</Typography>
                    <Typography variant="body2">One video at a time</Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2">Supported formats: JPG, PNG, WEBP</Typography>
                    <Typography variant="body2">Maximum file size: 20MB per image</Typography>
                  </Box>
                )}
              </Box>
              
              <input
                id="file-input"
                type="file"
                multiple={uploadMode === 'images'}
                accept={uploadMode === 'video' ? 'video/*' : 'image/*'}
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
            </CardContent>
          </Card>

          {/* Uploaded Files Display */}
          {files.length > 0 && (
            <Box sx={{ mt: 6 }}>
              <Card sx={{
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <CheckCircle sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Uploaded Files ({files.length})
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {files.map((file, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper sx={{ 
                          p: 2, 
                          display: 'flex', 
                          alignItems: 'center',
                          bgcolor: 'action.hover',
                          borderRadius: 2
                        }}>
                          {uploadMode === 'video' ? (
                            <Video sx={{ mr: 2, color: 'primary.main', flexShrink: 0 }} />
                          ) : (
                            <ImageIcon sx={{ mr: 2, color: 'primary.main', flexShrink: 0 }} />
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {file.name}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Start Inspection Button */}
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Button
              onClick={startInspection}
              variant="contained"
              size="large"
              sx={{ 
                px: 6, 
                py: 2, 
                fontSize: '1.125rem',
                fontWeight: 600,
                borderRadius: 3
              }}
              startIcon={<Upload />}
            >
              Start Inspection
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default UploadPage;