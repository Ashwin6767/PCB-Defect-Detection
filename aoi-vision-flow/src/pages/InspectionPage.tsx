import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Zap,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Maximize2,
  BarChart3,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import pcbSample1 from '@/assets/pcb-sample-1.png';
import pcbSample2 from '@/assets/pcb-sample-2.png';
import pcbSample3 from '@/assets/pcb-sample-3.png';

interface InspectionResult {
  pcbId?: string;
  videoId?: string;
  frameNumber?: number;
  timestamp_seconds?: number;
  status: 'PASS' | 'FAIL' | 'QUESTIONABLE';
  defectType: string;
  metrics?: {
    total_defects?: number;
    total_frames?: number;
    processed_frames?: number;
    frames_with_defects?: number;
    defect_density?: number;
    duration_seconds?: number;
    fps?: number;
    processing_interval_ms?: number;
    frame_interval?: number;
    frame_number?: number;
    video_timestamp?: number;
  };
  defects_detected?: Array<{
    type: string;
    confidence: number;
    bbox: [number, number, number, number]; // x1, y1, x2, y2
    area: number;
  }>;
  defect_frames?: Array<{
    frame: number;
    timestamp: number;
    defects: Array<{
      type: string;
      confidence: number;
      bbox: [number, number, number, number];
      area: number;
    }>;
  }>;
  images?: {
    original: string;
    annotated: string;
  };
  files?: {
    original: string;
    processed: string;
  };
}

// Move sample results outside component to prevent re-creation
const sampleResults: InspectionResult[] = [
  {
    pcbId: 'PCB-001',
    status: 'PASS',
    defectType: 'None',
    metrics: {
      total_defects: 0,
      total_frames: 1,
      processed_frames: 1,
      frames_with_defects: 0,
      defect_density: 0,
      duration_seconds: 2.1,
      fps: 30,
      processing_interval_ms: 100
    }
  },
  {
    pcbId: 'PCB-002',
    status: 'FAIL',
    defectType: 'Solder Bridge',
    metrics: {
      total_defects: 2,
      total_frames: 1,
      processed_frames: 1,
      frames_with_defects: 1,
      defect_density: 0.8,
      duration_seconds: 2.3,
      fps: 30,
      processing_interval_ms: 100
    },
    defects_detected: [
      {
        type: 'solder_bridge',
        confidence: 0.92,
        bbox: [120, 80, 180, 140],
        area: 3600
      },
      {
        type: 'solder_bridge',
        confidence: 0.87,
        bbox: [200, 150, 240, 190],
        area: 1600
      }
    ]
  },
  {
    pcbId: 'PCB-003',
    status: 'QUESTIONABLE',
    defectType: 'Possible Missing Component',
    metrics: {
      total_defects: 1,
      total_frames: 1,
      processed_frames: 1,
      frames_with_defects: 1,
      defect_density: 0.5,
      duration_seconds: 2.0,
      fps: 30,
      processing_interval_ms: 100
    },
    defects_detected: [
      {
        type: 'missing_component',
        confidence: 0.95,
        bbox: [300, 200, 350, 250],
        area: 2500
      }
    ]
  },
  {
    pcbId: 'PCB-004',
    status: 'PASS',
    defectType: 'None',
    metrics: {
      total_defects: 0,
      total_frames: 1,
      processed_frames: 1,
      frames_with_defects: 0,
      defect_density: 0,
      duration_seconds: 1.9,
      fps: 30,
      processing_interval_ms: 100
    }
  },
  {
    pcbId: 'PCB-005',
    status: 'FAIL',
    defectType: 'Cold Joint',
    metrics: {
      total_defects: 1,
      total_frames: 1,
      processed_frames: 1,
      frames_with_defects: 1,
      defect_density: 0.3,
      duration_seconds: 2.2,
      fps: 30,
      processing_interval_ms: 100
    },
    defects_detected: [
      {
        type: 'cold_joint',
        confidence: 0.78,
        bbox: [150, 100, 190, 140],
        area: 1600
      }
    ]
  },
];

const InspectionPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<InspectionResult[]>([]);
  const [currentPcbIndex, setCurrentPcbIndex] = useState(0);
  const [isInspecting, setIsInspecting] = useState(true);
  const [selectedResult, setSelectedResult] = useState<InspectionResult | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logResult, setLogResult] = useState<InspectionResult | null>(null);
  const [expectedResultCount, setExpectedResultCount] = useState(0);
  const [uploadMode, setUploadMode] = useState<'images' | 'video'>('images');
  const [inspectionSpeed, setInspectionSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    throughput: 0,
    efficiency: 0,
    avgProcessingTime: 0,
    totalProcessed: 0
  });
  const [systemStatus, setSystemStatus] = useState<'ONLINE' | 'OFFLINE' | 'MAINTENANCE'>('ONLINE');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);

  // Media error states
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());

  const pcbImages = [pcbSample1, pcbSample2, pcbSample3];

  // Helper functions
  const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

  const validateUploadMode = (mode: string | null): 'images' | 'video' => {
    return mode === 'video' ? 'video' : 'images';
  };

  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set([...prev, imageId]));
  };

  const handleVideoError = (videoId: string) => {
    setVideoErrors(prev => new Set([...prev, videoId]));
  };

  useEffect(() => {
    // Check for YOLOv10 results first
    const storedResults = sessionStorage.getItem('inspectionResults');
    const uploadedFiles = sessionStorage.getItem('uploadedFiles');
    const storedUploadMode = validateUploadMode(sessionStorage.getItem('uploadMode'));

    setUploadMode(storedUploadMode);

    // Determine the expected number of results
    let expectedCount = 5; // default fallback
    let resultsToUse = sampleResults; // default to sample results

    if (uploadedFiles) {
      const fileList = JSON.parse(uploadedFiles);
      expectedCount = storedUploadMode === 'video' ? 1 : fileList.length;

      // If we have YOLOv10 results, use them instead of samples
      if (storedResults) {
        const parsedResults = JSON.parse(storedResults);
        resultsToUse = parsedResults;
        expectedCount = parsedResults.length;
      }
    }

    setExpectedResultCount(expectedCount);

    let currentIndex = 0;
    let pcbCycleIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < resultsToUse.length) {
        const nextResult = resultsToUse[currentIndex];

        // Update PCB index before adding result for better visual sync
        setCurrentPcbIndex(pcbCycleIndex % pcbImages.length);

        // Small delay to show PCB under camera before result
        setTimeout(() => {
          setResults(prev => {
            const newResults = [...prev, nextResult];

            // Add notification for critical defects
            if (nextResult.status === 'FAIL') {
              setNotifications(prevNotifications => [
                ...prevNotifications.slice(-4), // Keep only last 5 notifications
                {
                  id: Date.now().toString(),
                  type: 'critical',
                  message: `Critical defect detected: ${nextResult.defectType} in ${nextResult.pcbId || nextResult.videoId}`,
                  timestamp: new Date()
                }
              ]);
            }

            return newResults;
          });
          // Counter will update automatically via results state change
        }, 500);

        currentIndex++;
        pcbCycleIndex++;
      } else {
        setIsInspecting(false);
        clearInterval(interval);
      }
    }, storedUploadMode === 'video' ? 5000 : 2500); // Slightly longer for better visual timing

    return () => clearInterval(interval);
  }, [pcbImages.length]); // Empty dependency array to run only once

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear session storage when leaving inspection page
      sessionStorage.removeItem('uploadedFiles');
      sessionStorage.removeItem('inspectionResults');
      sessionStorage.removeItem('uploadMode');
      // Clear any ongoing intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Results state changes will automatically trigger re-renders

  // Update real-time statistics
  useEffect(() => {
    const updateStats = () => {
      const totalProcessed = results.length;
      const passCount = results.filter(r => r.status === 'PASS').length;
      const efficiency = totalProcessed > 0 ? Math.round((passCount / totalProcessed) * 100) : 0;
      const throughput = isInspecting ? Math.floor(Math.random() * 15) + 10 : 0; // Simulate throughput
      const avgProcessingTime = uploadMode === 'video' ? 5.2 : 2.1;

      setRealTimeStats({
        throughput,
        efficiency,
        avgProcessingTime,
        totalProcessed
      });
    };

    updateStats();
    const statsInterval = setInterval(updateStats, 1000);
    return () => clearInterval(statsInterval);
  }, [results, isInspecting, uploadMode]);

  const getStatusClass = (status: string) => {
    if (status === 'PASS') return 'status-pass';
    if (status === 'QUESTIONABLE') return 'status-questionable';
    return 'status-fail';
  };

  return (
    <div className="min-h-screen gradient-bg relative">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-success/5 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => {
              // Clear all session data before going back
              sessionStorage.removeItem('uploadedFiles');
              sessionStorage.removeItem('inspectionResults');
              sessionStorage.removeItem('uploadMode');
              // Call backend cleanup
              fetch(getApiUrl('/api/cleanup'), { method: 'POST' }).catch(() => { });
              navigate('/');
            }}
            className="btn-secondary"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Upload
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">AOI Inspector</h1>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${systemStatus === 'ONLINE' ? 'bg-success/20 text-success' :
                systemStatus === 'OFFLINE' ? 'bg-destructive/20 text-destructive' :
                  'bg-warning/20 text-warning'
                }`}>
                <div className={`w-2 h-2 rounded-full ${systemStatus === 'ONLINE' ? 'bg-success animate-pulse' :
                  systemStatus === 'OFFLINE' ? 'bg-destructive' :
                    'bg-warning animate-pulse'
                  }`}></div>
                System {systemStatus}
              </div>
              <div className="text-muted-foreground">
                {isInspecting ?
                  (uploadMode === 'video' ? 'Video Processing in Progress...' : 'Inspection in Progress...') :
                  (uploadMode === 'video' ? 'Video Processing Complete' : 'Inspection Complete')
                }
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="btn-secondary"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <div className="industrial-card glass-card p-4 mb-4 animate-fade-in-up border-l-4 border-destructive">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle size={20} />
                Critical Alerts
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotifications([])}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notifications.slice(-3).map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="text-destructive mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Status Bar */}
        <div className="industrial-card glass-card p-4 mb-6 animate-fade-in-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Activity className="text-primary" size={20} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Throughput</div>
                <div className="text-lg font-bold text-foreground">{realTimeStats.throughput}/min</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Zap className="text-success" size={20} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Quality Efficiency</div>
                <div className="text-lg font-bold text-foreground">{realTimeStats.efficiency}%</div>
                <div className="text-xs text-muted-foreground">Pass Rate</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Clock className="text-accent" size={20} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
                <div className="text-lg font-bold text-foreground">{realTimeStats.avgProcessingTime}s</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/20 rounded-lg">
                <BarChart3 className="text-warning" size={20} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Processed</div>
                <div className="text-lg font-bold text-foreground">{realTimeStats.totalProcessed}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Conveyor Belt Section */}
        <div className="industrial-card glass-card p-8 mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Inspection System</h2>

            {/* Control Panel */}
            <div className="flex items-center gap-2">
              {isInspecting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                  className="btn-secondary"
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResults([]);
                  setCurrentPcbIndex(0);
                  setIsInspecting(true);
                  // Component will re-render automatically
                }}
                className="btn-secondary"
              >
                <RotateCcw size={16} />
                Reset
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export results as CSV
                  const csvContent = results.map(r =>
                    `${r.pcbId || r.videoId},${r.status},${r.defectType}`
                  ).join('\n');
                  const blob = new Blob([`ID,Status,Defect Type\n${csvContent}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'inspection_results.csv';
                  a.click();
                }}
                className="btn-secondary"
              >
                <Download size={16} />
                Export
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    document.documentElement.requestFullscreen();
                  }
                }}
                className="btn-secondary"
              >
                <Maximize2 size={16} />
                Fullscreen
              </Button>
            </div>
          </div>

          <div className="relative mt-16">
            {/* Inspection Camera */}
            <div
              className="inspection-camera z-10"
              style={{
                animation: isInspecting ? 'cameraShake 2s ease-in-out infinite' : 'none'
              }}
            >
              <Camera size={32} className="text-accent" />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-accent/30 rounded-full"></div>
              {/* Scanning laser effect */}
              {isInspecting && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80 animate-pulse"></div>
              )}
              {/* Camera status LED */}
              <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isInspecting ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
            </div>

            {/* Conveyor Belt */}
            <div className="conveyor-belt h-24 relative rounded-lg">
              {/* Scanning line effect */}
              {isInspecting && (
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-accent via-accent/80 to-transparent transform -translate-x-1/2 z-20 animate-pulse"></div>
              )}

              {/* Inspection zone highlight */}
              {isInspecting && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-16 border-2 border-accent/50 rounded-lg animate-pulse z-10"></div>
              )}

              {/* PCB Items Moving on Belt */}
              {isInspecting && pcbImages.map((image, index) => (
                <div
                  key={`pcb-${index}-${results.length}`}
                  className={`pcb-item ${index === currentPcbIndex && results.length > 0
                    ? results[results.length - 1]?.status === 'PASS'
                      ? 'flash-pass'
                      : results[results.length - 1]?.status === 'QUESTIONABLE'
                        ? 'flash-questionable'
                        : 'flash-fail'
                    : ''
                    }`}
                  style={{
                    animationDelay: `${index * 2.5}s`,
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'overlay',
                  }}
                />
              ))}

              {/* Static PCB when inspection is complete */}
              {!isInspecting && (
                <div
                  className="pcb-item"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%) translateY(-50%)',
                    backgroundImage: `url(${pcbImages[0]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'overlay',
                    animation: 'none',
                  }}
                />
              )}
            </div>

            {/* Belt Supports and Status Indicators */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-metallic-dark to-metallic rounded-full shadow-inner"></div>
                <div className={`w-3 h-3 rounded-full ${isInspecting ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {isInspecting ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {isInspecting ? 'SCANNING' : 'COMPLETE'}
                </span>
                <div className={`w-3 h-3 rounded-full ${isInspecting ? 'bg-accent animate-pulse' : 'bg-muted'}`}></div>
                <div className="w-8 h-8 bg-gradient-to-br from-metallic-dark to-metallic rounded-full shadow-inner"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="industrial-card glass-card animate-fade-in-up animate-stagger-1">
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Inspection Results</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">
                      {uploadMode === 'video' ? 'Video ID' : 'PCB ID'}
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Defect Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr
                      key={result.pcbId}
                      className={`${getStatusClass(result.status)} transition-all duration-500 animate-fade-in-up`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="py-4 px-4 font-medium">
                        {result.pcbId || result.videoId}
                        {result.frameNumber && (
                          <div className="text-xs text-muted-foreground">
                            Frame {result.frameNumber} ({result.timestamp_seconds?.toFixed(1)}s)
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {result.status === 'PASS' ? (
                            <CheckCircle className="text-success" size={16} />
                          ) : result.status === 'QUESTIONABLE' ? (
                            <AlertTriangle className="text-warning" size={16} />
                          ) : (
                            <XCircle className="text-destructive" size={16} />
                          )}
                          <span className={`font-semibold ${result.status === 'PASS' ? 'text-success' :
                            result.status === 'QUESTIONABLE' ? 'text-warning' :
                              'text-destructive'
                            }`}>
                            {result.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">{result.defectType}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {result.metrics || result.defects_detected || result.defect_frames ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedResult(result);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye size={14} className="mr-1" />
                              Details
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Activity size={12} />
                              Sample
                            </span>
                          )}

                          {result.status === 'QUESTIONABLE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLogResult(result);
                                setShowLogModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FileText size={14} className="mr-1" />
                              Log
                            </Button>
                          )}

                          {result.status === 'FAIL' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Simulate flagging for review
                                if (import.meta.env.DEV) console.log('Flagged for review:', result.pcbId);
                              }}
                              className="text-warning hover:text-warning"
                            >
                              <AlertTriangle size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Show placeholder rows while inspecting */}
                  {isInspecting && Array.from({ length: expectedResultCount - results.length }).map((_, index) => (
                    <tr key={`pending-${index}`} className="opacity-30">
                      <td className="py-4 px-4">---</td>
                      <td className="py-4 px-4">Inspecting...</td>
                      <td className="py-4 px-4">---</td>
                      <td className="py-4 px-4">---</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Counter Section - Updates automatically */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-success">
                    {results.filter(r => r.status === 'PASS').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">
                    {results.filter(r => r.status === 'QUESTIONABLE').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Questionable</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">
                    {results.filter(r => r.status === 'FAIL').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{results.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {isInspecting ? `Processing... (${results.length}/${expectedResultCount})` : 'Total'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="industrial-card glass-card p-6 mb-8 animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-4">System Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Inspection Speed
                </label>
                <select
                  value={inspectionSpeed}
                  onChange={(e) => setInspectionSpeed(Number(e.target.value))}
                  className="w-full p-2 bg-muted border border-border rounded-lg text-foreground"
                >
                  <option value={0.5}>0.5x (Slow)</option>
                  <option value={1}>1x (Normal)</option>
                  <option value={1.5}>1.5x (Fast)</option>
                  <option value={2}>2x (Very Fast)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  System Status
                </label>
                <select
                  value={systemStatus}
                  onChange={(e) => setSystemStatus(e.target.value as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE')}
                  className="w-full p-2 bg-muted border border-border rounded-lg text-foreground"
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Auto Export
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoExport"
                    className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="autoExport" className="text-sm text-muted-foreground">
                    Export results automatically
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Dashboard Section */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
            {/* Enhanced Quality Distribution Chart */}
            <div className="industrial-card glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="text-primary" size={20} />
                  Quality Distribution
                </h3>
                <div className="text-sm text-muted-foreground">
                  {results.length > 0 ? `${((results.filter(r => r.status === 'PASS').length / results.length) * 100).toFixed(1)}% Pass Rate` : 'No Data'}
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="passGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="questionableGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>

                    <Pie
                      data={(() => {
                        if (results.length === 0) return [];

                        const passCount = results.filter(r => r.status === 'PASS').length;
                        const failCount = results.filter(r => r.status === 'FAIL').length;
                        const questionableCount = results.filter(r => r.status === 'QUESTIONABLE').length;

                        return [
                          {
                            name: 'Pass',
                            value: passCount,
                            percentage: (passCount / results.length) * 100,
                            fill: '#10B981'
                          },
                          {
                            name: 'Fail',
                            value: failCount,
                            percentage: (failCount / results.length) * 100,
                            fill: '#EF4444'
                          },
                          {
                            name: 'Questionable',
                            value: questionableCount,
                            percentage: (questionableCount / results.length) * 100,
                            fill: '#F59E0B'
                          }
                        ].filter(item => item.value > 0);
                      })()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {/* Cells are automatically generated from data */}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value: any, name: string) => [
                        `${value} items (${results.length > 0 ? ((value / results.length) * 100).toFixed(1) : 0}%)`,
                        name
                      ]}
                    />

                    <Legend
                      wrapperStyle={{ color: '#F9FAFB' }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Quality metrics summary */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{results.filter(r => r.status === 'PASS').length}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{results.filter(r => r.status === 'FAIL').length}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{results.filter(r => r.status === 'QUESTIONABLE').length}</div>
                  <div className="text-xs text-muted-foreground">Questionable</div>
                </div>
              </div>
            </div>

            {/* Real-Time Processing Analytics */}
            <div className="industrial-card glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="text-accent" size={20} />
                  Real-Time Analytics
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isInspecting ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                  <span className="text-muted-foreground">
                    {isInspecting ? 'Live Processing' : 'Processing Complete'}
                  </span>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={results.map((result, index) => ({
                    index: index + 1,
                    timestamp: new Date(Date.now() - (results.length - index) * 2500).toLocaleTimeString(),
                    cumulative: index + 1,
                    pass: results.slice(0, index + 1).filter(r => r.status === 'PASS').length,
                    fail: results.slice(0, index + 1).filter(r => r.status === 'FAIL').length,
                    questionable: results.slice(0, index + 1).filter(r => r.status === 'QUESTIONABLE').length,
                    efficiency: results.slice(0, index + 1).length > 0 ?
                      (results.slice(0, index + 1).filter(r => r.status === 'PASS').length / results.slice(0, index + 1).length) * 100 : 0,
                    throughput: Math.max(1, Math.floor((index + 1) / ((Date.now() - (Date.now() - results.length * 2500)) / 60000))) // Items per minute
                  }))}>
                    <defs>
                      <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="passAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="failAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />

                    <XAxis
                      dataKey="index"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      label={{ value: 'Processing Sequence', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />

                    <YAxis
                      yAxisId="count"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />

                    <YAxis
                      yAxisId="efficiency"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      domain={[0, 100]}
                      label={{ value: 'Quality Efficiency %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                      }}
                      labelFormatter={(value) => `Item #${value}`}
                      formatter={(value: any, name: string) => {
                        if (name === 'efficiency') return [`${value.toFixed(1)}%`, 'Quality Efficiency'];
                        return [value, name.charAt(0).toUpperCase() + name.slice(1)];
                      }}
                    />

                    <Legend
                      wrapperStyle={{ color: '#F9FAFB' }}
                      iconType="line"
                    />

                    {/* Stacked areas for pass/fail counts */}
                    <Area
                      yAxisId="count"
                      type="monotone"
                      dataKey="pass"
                      stackId="1"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#passAreaGradient)"
                      name="Pass"
                      animationDuration={800}
                    />

                    <Area
                      yAxisId="count"
                      type="monotone"
                      dataKey="fail"
                      stackId="1"
                      stroke="#EF4444"
                      strokeWidth={2}
                      fill="url(#failAreaGradient)"
                      name="Fail"
                      animationDuration={800}
                    />

                    {/* Efficiency trend line */}
                    <Line
                      yAxisId="efficiency"
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#1E40AF' }}
                      name="Quality Efficiency"
                      animationDuration={1000}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Real-time metrics */}
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{realTimeStats.throughput}</div>
                  <div className="text-xs text-muted-foreground">Items/min</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-success">{realTimeStats.efficiency}%</div>
                  <div className="text-xs text-muted-foreground">Quality Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">{realTimeStats.avgProcessingTime}s</div>
                  <div className="text-xs text-muted-foreground">Avg Time</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{results.length}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
              </div>
            </div>

            {/* Advanced Defect Analysis */}
            <div className="industrial-card glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="text-warning" size={20} />
                  Defect Analysis
                </h3>
                <div className="text-sm text-muted-foreground">
                  {results.filter(r => r.status !== 'PASS').length} Total Defects
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={(() => {
                    const defectCounts = results.reduce((acc, result) => {
                      if (result.status !== 'PASS') {
                        acc[result.defectType] = (acc[result.defectType] || 0) + 1;
                      }
                      return acc;
                    }, {} as Record<string, number>);

                    const defectData = Object.entries(defectCounts).map(([type, count]) => ({
                      defectType: type,
                      count,
                      severity: type.includes('Bridge') || type.includes('Missing') ? 'Critical' :
                        type.includes('Cold') || type.includes('Crack') ? 'Major' : 'Minor',
                      percentage: results.length > 0 ? (count / results.length) * 100 : 0, // Percentage of total results
                      trend: 0 // Real trend calculation would require historical data
                    }));

                    return defectData.sort((a, b) => b.count - a.count);
                  })()}>
                    <defs>
                      <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="majorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="minorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />

                    <XAxis
                      dataKey="defectType"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />

                    <YAxis
                      yAxisId="count"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />

                    <YAxis
                      yAxisId="percentage"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      domain={[0, 100]}
                      label={{ value: 'Percentage %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                      }}
                      formatter={(value: any, name: string, props: unknown) => {
                        if (name === 'percentage') return [`${value.toFixed(1)}%`, 'Percentage'];
                        if (name === 'count') return [value, `Count (${props.payload.severity})`];
                        return [value, name];
                      }}
                    />

                    <Legend
                      wrapperStyle={{ color: '#F9FAFB' }}
                    />

                    {/* Defect count bars with severity-based coloring */}
                    <Bar
                      yAxisId="count"
                      dataKey="count"
                      name="Defect Count"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1000}
                      fill="#3B82F6"
                    >
                      {(() => {
                        const defectCounts = results.reduce((acc, result) => {
                          if (result.status !== 'PASS') {
                            acc[result.defectType] = (acc[result.defectType] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>);

                        return Object.entries(defectCounts).map(([type, count], index) => {
                          const severity = type.includes('Bridge') || type.includes('Missing') ? 'Critical' :
                            type.includes('Cold') || type.includes('Crack') ? 'Major' : 'Minor';
                          const fill = severity === 'Critical' ? 'url(#criticalGradient)' :
                            severity === 'Major' ? 'url(#majorGradient)' : 'url(#minorGradient)';
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        });
                      })()}
                    </Bar>

                    {/* Percentage line */}
                    <Line
                      yAxisId="percentage"
                      type="monotone"
                      dataKey="percentage"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: '#059669' }}
                      name="Percentage"
                      animationDuration={1200}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Defect severity summary */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="text-lg font-bold text-destructive">
                    {results.filter(r => r.defectType.includes('Bridge') || r.defectType.includes('Missing')).length}
                  </div>
                  <div className="text-xs text-destructive">Critical</div>
                </div>
                <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="text-lg font-bold text-warning">
                    {results.filter(r => r.defectType.includes('Cold') || r.defectType.includes('Crack')).length}
                  </div>
                  <div className="text-xs text-warning">Major</div>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-lg font-bold text-primary">
                    {results.filter(r => r.status !== 'PASS' && !r.defectType.includes('Bridge') && !r.defectType.includes('Missing') && !r.defectType.includes('Cold') && !r.defectType.includes('Crack')).length}
                  </div>
                  <div className="text-xs text-primary">Minor</div>
                </div>
              </div>
            </div>

            {/* Performance Correlation Matrix */}
            <div className="industrial-card glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Zap className="text-success" size={20} />
                  Performance Matrix
                </h3>
                <div className="text-sm text-muted-foreground">
                  Processing vs Quality
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    data={results.map((result, index) => ({
                      processingTime: result.metrics?.duration_seconds || (uploadMode === 'video' ? 5.0 : 2.1),
                      qualityScore: result.status === 'PASS' ? 95 :
                        result.status === 'QUESTIONABLE' ? 75 :
                          result.metrics?.total_defects ? Math.max(20, 80 - (result.metrics.total_defects * 15)) : 30,
                      defectType: result.defectType,
                      status: result.status,
                      index: index + 1,
                      fill: result.status === 'PASS' ? '#10B981' :
                        result.status === 'QUESTIONABLE' ? '#F59E0B' : '#EF4444'
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />

                    <XAxis
                      type="number"
                      dataKey="processingTime"
                      name="Processing Time"
                      unit="s"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      domain={['dataMin - 0.1', 'dataMax + 0.1']}
                      label={{ value: 'Processing Time (seconds)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />

                    <YAxis
                      type="number"
                      dataKey="qualityScore"
                      name="Quality Score"
                      unit="%"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      domain={[0, 100]}
                      label={{ value: 'Quality Score (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />

                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                      }}
                      formatter={(value: unknown, name: string, props: unknown) => {
                        if (name === 'processingTime') return [`${value.toFixed(2)}s`, 'Processing Time'];
                        if (name === 'qualityScore') return [`${value.toFixed(1)}%`, 'Quality Score'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return `Item #${payload[0].payload.index} - ${payload[0].payload.status}`;
                        }
                        return label;
                      }}
                    />

                    <Scatter
                      dataKey="qualityScore"
                      fill="#3B82F6"
                      fillOpacity={0.7}
                    >
                      {results.map((result, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={result.status === 'PASS' ? '#10B981' :
                            result.status === 'QUESTIONABLE' ? '#F59E0B' : '#EF4444'}
                        />
                      ))}
                    </Scatter>

                    <Legend
                      wrapperStyle={{ color: '#F9FAFB' }}
                      iconType="circle"
                      payload={[
                        { value: 'Pass', type: 'circle', color: '#10B981' },
                        { value: 'Questionable', type: 'circle', color: '#F59E0B' },
                        { value: 'Fail', type: 'circle', color: '#EF4444' }
                      ]}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Performance insights */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-success/10 rounded-lg">
                    <div className="text-sm font-bold text-success">Optimal Zone</div>
                    <div className="text-xs text-muted-foreground">Fast & High Quality</div>
                  </div>
                  <div className="text-center p-2 bg-warning/10 rounded-lg">
                    <div className="text-sm font-bold text-warning">Review Zone</div>
                    <div className="text-xs text-muted-foreground">Needs Optimization</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Performance Monitor */}
            <div className="industrial-card glass-card p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="text-primary" size={20} />
                Live Performance Monitor
              </h3>

              {/* Real-time processing indicator */}
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">Processing Status</span>
                  <div className={`w-3 h-3 rounded-full ${isInspecting ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                </div>
                <div className="text-xs text-primary/80">
                  {isInspecting ? `Processing at ${inspectionSpeed}x speed` : 'System idle'}
                </div>
              </div>

              {/* Simple Performance Chart */}
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.map((result, index) => ({
                    index: index + 1,
                    efficiency: results.slice(0, index + 1).length > 0 ?
                      (results.slice(0, index + 1).filter(r => r.status === 'PASS').length / results.slice(0, index + 1).length) * 100 : 0,
                    throughput: Math.max(1, Math.floor((index + 1) / (2.5 * (index + 1) / 60))) // Real throughput calculation
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis
                      dataKey="index"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 3 }}
                      name="Quality %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Quality Metrics */}
              <div className="space-y-4">
                {/* Pass Rate */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Pass Rate</span>
                    <span className="text-sm font-medium text-success">
                      {results.length > 0 ? ((results.filter(r => r.status === 'PASS').length / results.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-success h-2 rounded-full transition-all duration-500"
                      style={{
                        width: results.length > 0 ? `${(results.filter(r => r.status === 'PASS').length / results.length) * 100}%` : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Defect Rate */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Defect Rate</span>
                    <span className="text-sm font-medium text-destructive">
                      {results.length > 0 ? ((results.filter(r => r.status === 'FAIL').length / results.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-destructive h-2 rounded-full transition-all duration-500"
                      style={{
                        width: results.length > 0 ? `${(results.filter(r => r.status === 'FAIL').length / results.length) * 100}%` : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Processing Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Processing Progress</span>
                    <span className="text-sm font-medium text-primary">
                      {isInspecting ? `${((results.length / expectedResultCount) * 100).toFixed(0)}%` : '100%'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{
                        width: isInspecting ? `${(results.length / expectedResultCount) * 100}%` : '100%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* YOLOv10 Model Accuracy */}
                <div className="mt-6 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">YOLOv10 Model Accuracy</span>
                    <span className="text-lg font-bold text-primary">94.97%</span>
                  </div>
                  <div className="text-xs text-primary/80 mt-1">
                    Trained on 8 PCB defect types
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No inspection data available for analytics</p>
              <p className="text-sm">Charts will appear once inspection begins</p>
            </div>
          </div>
        )}

        {/* Statistical Process Control Chart - CRITICAL for Manufacturing */}
        {results.length > 0 && (
          <div className="mt-8">
            <div className="industrial-card glass-card p-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="text-destructive" size={20} />
                  Statistical Process Control (SPC)
                </h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-destructive"></div>
                    <span className="text-muted-foreground">UCL (Upper Control Limit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-warning"></div>
                    <span className="text-muted-foreground">Center Line</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-destructive"></div>
                    <span className="text-muted-foreground">LCL (Lower Control Limit)</span>
                  </div>
                </div>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={(() => {
                    // Generate time-series data with proper SPC calculations
                    const timeSeriesData = [];
                    const batchSize = Math.max(1, Math.floor(results.length / 10)); // Group into time periods

                    for (let i = 0; i < results.length; i += batchSize) {
                      const batch = results.slice(i, i + batchSize);
                      const defectRate = (batch.filter(r => r.status === 'FAIL').length / batch.length) * 100;
                      const timestamp = new Date(Date.now() - (results.length - i) * 150000); // 2.5 min intervals

                      timeSeriesData.push({
                        timePoint: i / batchSize + 1,
                        timestamp: timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        }),
                        defectRate: defectRate,
                        sampleSize: batch.length,
                        defectCount: batch.filter(r => r.status === 'FAIL').length,
                        // SPC status indicators
                        isOutOfControl: false, // Will be calculated below
                        trend: 'stable'
                      });
                    }

                    // Calculate SPC control limits (using standard 3-sigma limits)
                    const overallDefectRate = (results.filter(r => r.status === 'FAIL').length / results.length) * 100;
                    const avgSampleSize = results.length / timeSeriesData.length;

                    // Standard deviation for defect rate (using binomial distribution)
                    const p = overallDefectRate / 100;
                    const standardError = Math.sqrt((p * (1 - p)) / avgSampleSize) * 100;

                    const centerLine = overallDefectRate;
                    const upperControlLimit = Math.min(100, centerLine + (3 * standardError));
                    const lowerControlLimit = Math.max(0, centerLine - (3 * standardError));

                    // Mark out-of-control points
                    timeSeriesData.forEach((point, index) => {
                      point.isOutOfControl = point.defectRate > upperControlLimit || point.defectRate < lowerControlLimit;

                      // Trend detection (7 consecutive points above/below center line)
                      if (index >= 6) {
                        const last7 = timeSeriesData.slice(index - 6, index + 1);
                        const allAbove = last7.every(p => p.defectRate > centerLine);
                        const allBelow = last7.every(p => p.defectRate < centerLine);

                        if (allAbove) point.trend = 'increasing';
                        else if (allBelow) point.trend = 'decreasing';
                      }
                    });

                    // Add control limit lines to data
                    return timeSeriesData.map(point => ({
                      ...point,
                      centerLine,
                      upperControlLimit,
                      lowerControlLimit,
                      // Warning limits (2-sigma)
                      upperWarningLimit: Math.min(100, centerLine + (2 * standardError)),
                      lowerWarningLimit: Math.max(0, centerLine - (2 * standardError))
                    }));
                  })()}>

                    <defs>
                      <linearGradient id="defectRateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="controlZoneGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

                    <XAxis
                      dataKey="timestamp"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      label={{
                        value: 'Time Period',
                        position: 'insideBottom',
                        offset: -10,
                        style: { textAnchor: 'middle', fill: '#9CA3AF' }
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      domain={[0, 'dataMax + 5']}
                      label={{
                        value: 'Defect Rate (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#9CA3AF' }
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                      }}
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value: unknown, name: string, props: unknown) => {
                        const data = props.payload;
                        if (name === 'defectRate') {
                          return [
                            <div key="defect-info">
                              <div>{`${value.toFixed(2)}% Defect Rate`}</div>
                              <div className="text-xs text-muted-foreground">
                                {`${data.defectCount}/${data.sampleSize} failed`}
                              </div>
                              {data.isOutOfControl && (
                                <div className="text-xs text-destructive font-bold">
                                  ⚠️ OUT OF CONTROL
                                </div>
                              )}
                              {data.trend !== 'stable' && (
                                <div className="text-xs text-warning">
                                  📈 Trend: {data.trend}
                                </div>
                              )}
                            </div>,
                            'Defect Rate'
                          ];
                        }
                        if (name === 'upperControlLimit') return [`${value.toFixed(2)}%`, 'UCL'];
                        if (name === 'centerLine') return [`${value.toFixed(2)}%`, 'Center Line'];
                        if (name === 'lowerControlLimit') return [`${value.toFixed(2)}%`, 'LCL'];
                        return [value, name];
                      }}
                    />

                    <Legend
                      wrapperStyle={{ color: '#F9FAFB' }}
                      iconType="line"
                    />

                    {/* Control limit area (between UCL and LCL) */}
                    <Area
                      type="monotone"
                      dataKey="upperControlLimit"
                      stroke="none"
                      fill="url(#controlZoneGradient)"
                      fillOpacity={0.3}
                      name="Control Zone"
                    />

                    {/* Upper Control Limit */}
                    <Line
                      type="monotone"
                      dataKey="upperControlLimit"
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={false}
                      name="UCL"
                      connectNulls={false}
                    />

                    {/* Center Line */}
                    <Line
                      type="monotone"
                      dataKey="centerLine"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Center Line"
                    />

                    {/* Lower Control Limit */}
                    <Line
                      type="monotone"
                      dataKey="lowerControlLimit"
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={false}
                      name="LCL"
                    />

                    {/* Warning Limits */}
                    <Line
                      type="monotone"
                      dataKey="upperWarningLimit"
                      stroke="#F59E0B"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      dot={false}
                      name="Upper Warning"
                      strokeOpacity={0.6}
                    />

                    <Line
                      type="monotone"
                      dataKey="lowerWarningLimit"
                      stroke="#F59E0B"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      dot={false}
                      name="Lower Warning"
                      strokeOpacity={0.6}
                    />

                    {/* Actual Defect Rate Line */}
                    <Line
                      type="monotone"
                      dataKey="defectRate"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={(props: unknown) => {
                        const { cx, cy, payload } = props;
                        if (!payload) return null;

                        // Different colors for different conditions
                        let fillColor = '#3B82F6'; // Normal - blue
                        let size = 6;

                        if (payload.isOutOfControl) {
                          fillColor = '#EF4444'; // Out of control - red
                          size = 8;
                        } else if (payload.defectRate > payload.upperWarningLimit ||
                          payload.defectRate < payload.lowerWarningLimit) {
                          fillColor = '#F59E0B'; // Warning zone - orange
                          size = 7;
                        }

                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={size}
                            fill={fillColor}
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={{
                        r: 8,
                        stroke: '#3B82F6',
                        strokeWidth: 3,
                        fill: '#1E40AF'
                      }}
                      name="Defect Rate"
                      animationDuration={1500}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* SPC Analysis Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
                <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-lg font-bold text-primary">
                    {((results.filter(r => r.status === 'FAIL').length / results.length) * 100).toFixed(2)}%
                  </div>
                  <div className="text-xs text-primary">Overall Defect Rate</div>
                </div>

                <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="text-lg font-bold text-success">
                    {(() => {
                      const batchSize = Math.max(1, Math.floor(results.length / 10));
                      let inControlCount = 0;

                      for (let i = 0; i < results.length; i += batchSize) {
                        const batch = results.slice(i, i + batchSize);
                        const defectRate = (batch.filter(r => r.status === 'FAIL').length / batch.length) * 100;
                        const overallRate = (results.filter(r => r.status === 'FAIL').length / results.length) * 100;
                        const p = overallRate / 100;
                        const standardError = Math.sqrt((p * (1 - p)) / batch.length) * 100;
                        const ucl = Math.min(100, overallRate + (3 * standardError));
                        const lcl = Math.max(0, overallRate - (3 * standardError));

                        if (defectRate <= ucl && defectRate >= lcl) {
                          inControlCount++;
                        }
                      }

                      const totalBatches = Math.ceil(results.length / batchSize);
                      return Math.round((inControlCount / totalBatches) * 100);
                    })()}%
                  </div>
                  <div className="text-xs text-success">Process In Control</div>
                </div>

                <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="text-lg font-bold text-warning">
                    {(() => {
                      // Calculate Cpk (Process Capability Index)
                      const overallRate = (results.filter(r => r.status === 'FAIL').length / results.length) * 100;
                      const target = 0; // Target defect rate is 0%
                      const tolerance = 5; // 5% tolerance

                      // Simplified Cpk calculation for demonstration
                      const cpk = Math.max(0, (tolerance - Math.abs(overallRate - target)) / (3 * Math.sqrt(overallRate * (100 - overallRate) / results.length)));
                      return cpk.toFixed(2);
                    })()}
                  </div>
                  <div className="text-xs text-warning">Process Capability (Cpk)</div>
                </div>

                <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="text-lg font-bold text-destructive">
                    {(() => {
                      // Count out-of-control points
                      const batchSize = Math.max(1, Math.floor(results.length / 10));
                      let outOfControlCount = 0;

                      for (let i = 0; i < results.length; i += batchSize) {
                        const batch = results.slice(i, i + batchSize);
                        const defectRate = (batch.filter(r => r.status === 'FAIL').length / batch.length) * 100;
                        const overallRate = (results.filter(r => r.status === 'FAIL').length / results.length) * 100;
                        const p = overallRate / 100;
                        const standardError = Math.sqrt((p * (1 - p)) / batch.length) * 100;
                        const ucl = Math.min(100, overallRate + (3 * standardError));
                        const lcl = Math.max(0, overallRate - (3 * standardError));

                        if (defectRate > ucl || defectRate < lcl) {
                          outOfControlCount++;
                        }
                      }

                      return outOfControlCount;
                    })()}
                  </div>
                  <div className="text-xs text-destructive">Out of Control Points</div>
                </div>
              </div>

              {/* SPC Alerts */}
              {(() => {
                const alerts = [];
                const batchSize = Math.max(1, Math.floor(results.length / 10));
                const overallRate = (results.filter(r => r.status === 'FAIL').length / results.length) * 100;

                // Check for out-of-control conditions
                for (let i = 0; i < results.length; i += batchSize) {
                  const batch = results.slice(i, i + batchSize);
                  const defectRate = (batch.filter(r => r.status === 'FAIL').length / batch.length) * 100;
                  const p = overallRate / 100;
                  const standardError = Math.sqrt((p * (1 - p)) / batch.length) * 100;
                  const ucl = Math.min(100, overallRate + (3 * standardError));

                  if (defectRate > ucl) {
                    alerts.push({
                      type: 'critical',
                      message: `Defect rate spike detected: ${defectRate.toFixed(1)}% (exceeds UCL of ${ucl.toFixed(1)}%)`,
                      time: new Date(Date.now() - (results.length - i) * 150000).toLocaleTimeString()
                    });
                  }
                }

                return alerts.length > 0 ? (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="text-destructive" size={20} />
                      <h4 className="font-semibold text-destructive">SPC Alerts</h4>
                    </div>
                    <div className="space-y-2">
                      {alerts.slice(0, 3).map((alert, index) => (
                        <div key={index} className="text-sm">
                          <span className="text-destructive font-medium">{alert.time}:</span>
                          <span className="text-foreground ml-2">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-foreground">
                    {selectedResult.videoId ? 'Video' : 'Defect'} Analysis - {selectedResult.pcbId || selectedResult.videoId}
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PCB Image/Video with Analysis */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-foreground">
                      {selectedResult.videoId ? 'Video Analysis' : 'PCB Analysis'}
                    </h4>

                    {selectedResult.videoId && selectedResult.files?.processed ? (
                      // Video summary view - show full processed video
                      <div className="space-y-4">
                        <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
                          <h5 className="font-medium text-success mb-1">Complete Video Analysis</h5>
                          <div className="text-sm text-success">
                            Full processed video with frame-by-frame defect detection overlays
                          </div>
                        </div>
                        <div className="relative border rounded-lg overflow-hidden">
                          {videoErrors.has(selectedResult.files?.processed || '') ? (
                            <div className="flex items-center justify-center h-48 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                              <div className="text-center p-4">
                                <h4 className="font-bold mb-2">❌ Video Loading Failed</h4>
                                <p className="text-sm mb-1">
                                  <strong>File:</strong> {selectedResult.files?.processed}
                                </p>
                                <p className="text-xs mb-1">
                                  <strong>URL:</strong> {getApiUrl(`/api/videos/${selectedResult.files?.processed}`)}
                                </p>
                                <div className="space-x-2 mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(getApiUrl(`/api/videos/${selectedResult.files?.processed}`), '_blank')}
                                  >
                                    Open Direct Link
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setVideoErrors(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(selectedResult.files?.processed || '');
                                        return newSet;
                                      });
                                    }}
                                  >
                                    Retry
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <video
                              controls
                              className="w-full h-auto max-h-96"
                              src={getApiUrl(`/api/videos/${selectedResult.files.processed}`)}
                              onLoadStart={() => {
                                if (import.meta.env.DEV) {
                                  console.log('🎥 Video loading started:', selectedResult.files?.processed);
                                  console.log('🎥 Full URL:', getApiUrl(`/api/videos/${selectedResult.files?.processed}`));
                                }
                              }}
                              onLoadedMetadata={() => {
                                if (import.meta.env.DEV) console.log('🎥 Video metadata loaded');
                                const video = document.getElementById('defect-video') as HTMLVideoElement;
                                if (video) {
                                  console.log('🎥 Video duration:', video.duration);
                                  console.log('🎥 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
                                }
                              }}
                              onCanPlay={() => {
                                if (import.meta.env.DEV) console.log('🎥 Video can play:', selectedResult.files?.processed);
                              }}
                              onError={(e) => {
                                const videoElement = e.target as HTMLVideoElement;
                                if (import.meta.env.DEV) {
                                  console.error('❌ Video loading error:', {
                                    error: e,
                                    src: videoElement.src,
                                    networkState: videoElement.networkState,
                                    readyState: videoElement.readyState,
                                    filename: selectedResult.files?.processed
                                  });
                                }
                                handleVideoError(selectedResult.files?.processed || '');
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                            Video Summary - {selectedResult.status === 'PASS' ? '✓ PASS' : selectedResult.status === 'QUESTIONABLE' ? '? QUESTIONABLE' : '✗ FAIL'}
                          </div>
                        </div>

                        {/* Video Controls Info */}
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                          <h6 className="font-medium text-primary mb-2">Video Analysis Features</h6>
                          <ul className="text-sm text-foreground space-y-1">
                            <li>• Green text: Frames processed with YOLO detection</li>
                            <li>• Red text: Frames skipped (700ms sampling)</li>
                            <li>• Bounding boxes: Detected defects with confidence scores</li>
                            <li>• Frame counter: Shows processing progress</li>
                          </ul>
                        </div>
                      </div>
                    ) : selectedResult.frameNumber && selectedResult.images?.annotated ? (
                      // Individual frame view - show specific frame
                      <div className="space-y-4">
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                          <h5 className="font-medium text-primary mb-1">Video Frame Analysis</h5>
                          <div className="text-sm text-foreground">
                            Frame {selectedResult.frameNumber} at {selectedResult.timestamp_seconds?.toFixed(2)}s
                          </div>
                        </div>
                        <div className="relative border rounded-lg overflow-hidden">
                          <img
                            src={getApiUrl(`/api/images/${selectedResult.images.annotated}`)}
                            alt={`Frame ${selectedResult.frameNumber} - Annotated`}
                            className="w-full h-auto max-h-96 object-contain"
                            onError={(e) => {
                              // Fallback to original image if annotated not available
                              if (selectedResult.images?.original) {
                                (e.target as HTMLImageElement).src =
                                  getApiUrl(`/api/images/${selectedResult.images.original}`);
                              } else {
                                // Show placeholder if no images available
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZyYW1lIEltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                              }
                            }}
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                            Frame {selectedResult.frameNumber} - {selectedResult.status === 'PASS' ? '✓ PASS' : selectedResult.status === 'QUESTIONABLE' ? '? QUESTIONABLE' : '✗ FAIL'}
                          </div>
                        </div>
                      </div>
                    ) : selectedResult.images?.annotated ? (
                      // Regular PCB image display
                      <div className="relative border rounded-lg overflow-hidden">
                        <img
                          src={getApiUrl(`/api/images/${selectedResult.images.annotated}`)}
                          alt={`${selectedResult.pcbId} - Annotated`}
                          className="w-full h-auto max-h-96 object-contain"
                          onError={(e) => {
                            // Fallback to original image if annotated not available
                            if (selectedResult.images?.original) {
                              (e.target as HTMLImageElement).src =
                                getApiUrl(`/api/images/${selectedResult.images.original}`);
                            } else {
                              // Show placeholder if no images available
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                            }
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                          {selectedResult.status === 'PASS' ? '✓ PASS' : '✗ FAIL'}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No {selectedResult.videoId ? 'video' : 'image'} available for this result</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          This may be sample data or the files may have been cleaned up
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Defect Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-foreground">Detection Details</h4>

                    {/* Summary */}
                    <div className="bg-muted rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-foreground">Status:</span>
                          <span className={`ml-2 font-bold ${selectedResult.status === 'PASS' ? 'text-success' :
                            selectedResult.status === 'QUESTIONABLE' ? 'text-warning' : 'text-destructive'
                            }`}>
                            {selectedResult.status}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Primary Defect:</span>
                          <span className="ml-2 text-muted-foreground">{selectedResult.defectType}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Total Defects:</span>
                          <span className="ml-2 text-muted-foreground">
                            {selectedResult.metrics?.total_defects || selectedResult.defects_detected?.length || 0}
                          </span>
                        </div>
                        {selectedResult.videoId && selectedResult.metrics && (
                          <>
                            <div>
                              <span className="font-medium text-foreground">Total Frames:</span>
                              <span className="ml-2 text-muted-foreground">{selectedResult.metrics.total_frames || 0}</span>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Processed Frames:</span>
                              <span className="ml-2 text-muted-foreground">{selectedResult.metrics.processed_frames || 0}</span>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Frames with Defects:</span>
                              <span className="ml-2 text-muted-foreground">{selectedResult.metrics.frames_with_defects || 0}</span>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Duration:</span>
                              <span className="ml-2 text-muted-foreground">{selectedResult.metrics.duration_seconds?.toFixed(1) || 0}s</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* YOLOv10 Model Analysis */}
                    {selectedResult.metrics && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <h5 className="font-medium text-primary mb-2">YOLOv10 Model Analysis</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-foreground">Total Defects Detected:</span>
                            <span className="font-medium text-foreground">{selectedResult.metrics.total_defects || 0}</span>
                          </div>
                          {selectedResult.videoId && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-foreground">Defect Density:</span>
                                <span className="font-medium text-foreground">{((selectedResult.metrics.defect_density || 0) * 100).toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground">Video FPS:</span>
                                <span className="font-medium text-foreground">{selectedResult.metrics.fps?.toFixed(1) || 0}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Individual Defects */}
                    {selectedResult.defects_detected && selectedResult.defects_detected.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Detected Defects:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedResult.defects_detected.map((defect, index) => (
                            <div key={index} className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-destructive">
                                  {defect.type.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-destructive">
                                  {(defect.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-destructive text-xs mt-1">
                                Area: {defect.area.toFixed(0)}px²
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Defect Frames for Video */}
                    {selectedResult.defect_frames && selectedResult.defect_frames.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Defect Timeline:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedResult.defect_frames.map((frame, index) => (
                            <div key={index} className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm">
                              <div className="flex justify-between mb-2">
                                <span className="font-medium text-warning">Frame {frame.frame}</span>
                                <span className="text-warning">{frame.timestamp.toFixed(2)}s</span>
                              </div>
                              {frame.defects.map((defect, defectIndex) => (
                                <div key={defectIndex} className="text-xs text-warning/80 ml-2">
                                  • {defect.type.replace('_', ' ')} ({(defect.confidence * 100).toFixed(1)}%)
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Log Input Modal */}
        {showLogModal && logResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">Log Inspection Result</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowLogModal(false)}
                  size="sm"
                >
                  ×
                </Button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  PCB ID: <span className="font-medium text-foreground">{logResult.pcbId || logResult.videoId}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Current Status: <span className="font-medium text-warning">QUESTIONABLE</span>
                </p>
                <p className="text-sm text-foreground mb-4">
                  Please select the correct classification for this inspection result:
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    console.log('Logged as GOOD:', logResult.pcbId || logResult.videoId);
                    // Here you would typically send this to your backend
                    // fetch('/api/log-result', { method: 'POST', body: JSON.stringify({ id: logResult.pcbId, classification: 'GOOD' }) })
                    setShowLogModal(false);
                  }}
                  className="flex-1 bg-success hover:bg-success/90 text-white"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Good
                </Button>
                <Button
                  onClick={() => {
                    console.log('Logged as DEFECTIVE:', logResult.pcbId || logResult.videoId);
                    // Here you would typically send this to your backend
                    // fetch('/api/log-result', { method: 'POST', body: JSON.stringify({ id: logResult.pcbId, classification: 'DEFECTIVE' }) })
                    setShowLogModal(false);
                  }}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                >
                  <XCircle size={16} className="mr-2" />
                  Defective
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowLogModal(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionPage;