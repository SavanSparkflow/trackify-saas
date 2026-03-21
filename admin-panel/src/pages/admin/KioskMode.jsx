import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Camera, ShieldCheck, Zap, UserCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import { useNavigate } from 'react-router-dom';

export default function KioskMode() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [faceMatcher, setFaceMatcher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [initializingCamera, setInitializingCamera] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);
    const [scanCooldown, setScanCooldown] = useState(false);
    const [pendingChoice, setPendingChoice] = useState(null); // { employee, photo, location, status }
    const [actionCountdown, setActionCountdown] = useState(5);
    
    const [identityVerified, setIdentityVerified] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const loadModelsAndData = async () => {
            try {
                // 1. Load face-api models
                const MODEL_URL = 'https://unpkg.com/@vladmandic/face-api/model/';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);

                // 2. Fetch employees
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/kiosk/employees`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const empData = res.data;
                setEmployees(empData);

                // 3. Create Face Matcher
                await createFaceMatcher(empData);
                
                setLoading(false);
                setScanning(true);
            } catch (err) {
                console.error("Initialization error:", err);
                toast.error("Failed to initialize Kiosk Mode.");
                setLoading(false);
            }
        };

        loadModelsAndData();

        return () => stopStream();
    }, []);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const createFaceMatcher = async (empData) => {
        const labeledDescriptors = [];
        let photoCount = 0;
        let successCount = 0;
        
        toast.loading("Setting up Face Identity System...", { id: 'descriptors' });
        
        for (const emp of empData) {
            if (!emp.attendancePhoto) continue;
            photoCount++;

            try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = emp.attendancePhoto;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                // Optimization: Pre-process image for better visibility
                const processingCanvas = document.createElement('canvas');
                const ctx = processingCanvas.getContext('2d');
                processingCanvas.width = img.width;
                processingCanvas.height = img.height;
                ctx.filter = 'contrast(1.2) brightness(1.1)'; 
                ctx.drawImage(img, 0, 0);

                // Use detectSingleFace for employee photos (1 person per photo)
                let detection = await faceapi.detectSingleFace(processingCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!detection) {
                    console.log(`SSD failed for ${emp.name}, trying TinyFace fallback...`);
                    detection = await faceapi.detectSingleFace(processingCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.1 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                }

                if (detection) {
                    labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(emp._id, [detection.descriptor]));
                    successCount++;
                } else {
                    console.error(`AI Detection failed for photo of ${emp.name}. Potential cause: Poor lighting or extreme angle.`);
                }
            } catch (error) {
                console.error(`Error processing photo for ${emp.name}:`, error.message);
            }
        }

        if (labeledDescriptors.length > 0) {
            setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.50));
            toast.success(`Face Identity Ready! (${successCount} Staff Loaded)`, { id: 'descriptors' });
            setScanning(true);
        } else {
            if (photoCount === 0) {
                toast.error("No staff photos found! Please upload photos in Admin Panel first.", { id: 'descriptors', duration: 6000 });
            } else {
                toast.error(`Found ${photoCount} photos, but AI couldn't detect any faces. Please upload clearer face photos.`, { id: 'descriptors', duration: 7000 });
            }
            setScanning(false);
        }
    };

    // --- CAMERA HANDLER ---
    useEffect(() => {
        const startCamera = async () => {
            if (!scanning || !modelsLoaded) return;
            setInitializingCamera(true);
            try {
                stopStream();
                const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
                streamRef.current = s;
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                    videoRef.current.play().catch(e => console.error(e));
                }
            } catch (err) {
                console.error("Camera access error:", err);
                toast.error(`Camera Error: ${err.message}`);
                setScanning(false);
            } finally {
                setInitializingCamera(false);
            }
        };
        startCamera();
    }, [scanning, modelsLoaded]);

    useEffect(() => {
        let timeoutId = null;
        let isActive = true;

        const scanLoop = async () => {
            if (!isActive) return;
            
            // Initial check to decide if scanning should proceed or wait
            if (!scanning || !modelsLoaded || !faceMatcher || initializingCamera || scanCooldown || pendingChoice) {
                timeoutId = setTimeout(scanLoop, 500); 
                return;
            }

            if (videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) {
                try {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    
                    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ 
                        inputSize: 320,
                        scoreThreshold: 0.5 
                    })).withFaceLandmarks().withFaceDescriptor();
                    
                    const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
                    faceapi.matchDimensions(canvas, displaySize);

                    if (detection) {
                        setFaceDetected(true);
                        const resizedDetections = faceapi.resizeResults(detection, displaySize);
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        const box = resizedDetections.detection.box;
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 4;
                        ctx.strokeRect(box.x, box.y, box.width, box.height);

                        const match = faceMatcher.findBestMatch(detection.descriptor);
                        if (match.label !== 'unknown' && match.distance <= 0.55) {
                            setIdentityVerified(true);
                            handleMatchFound(match.label);
                        } else {
                            setIdentityVerified(false);
                        }
                    } else {
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        setFaceDetected(false);
                        setIdentityVerified(false);
                    }
                } catch (err) {
                    console.error("Scan loop error:", err);
                }
            }
            
            timeoutId = setTimeout(scanLoop, 100); 
        };

        if (scanning && modelsLoaded && faceMatcher) {
            scanLoop();
        }

        return () => { 
            isActive = false;
            if (timeoutId) clearTimeout(timeoutId); 
        };
    }, [scanning, modelsLoaded, faceMatcher, initializingCamera, scanCooldown, pendingChoice]);

    const handleMatchFound = async (userId, explicitAction = 'auto') => {
        // Prevent multiple simultaneous scans
        if (!explicitAction || explicitAction === 'auto') {
            setScanCooldown(true);
        }
        
        const employee = employees.find(e => e._id === userId);
        if (!employee) {
            setScanCooldown(false);
            return;
        }

        // Only capture once per scan session
        const photo = pendingChoice?.photo || captureSnapshot();
        const location = pendingChoice?.location || await getCurrentLocation();

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/kiosk/punch`, {
                userId,
                location,
                photo,
                action: explicitAction
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.requiresActionChoice) {
                setPendingChoice({
                    employee,
                    photo,
                    location,
                    status: res.data.status
                });
                setActionCountdown(5);
                return;
            }

            setPendingChoice(null);
            setLastScanResult({
                name: employee.name,
                message: res.data.message,
                status: 'success',
                time: new Date().toLocaleTimeString()
            });
            toast.success(`${employee.name}: ${res.data.message}`);
        } catch (err) {
            setPendingChoice(null);
            setLastScanResult({
                name: employee.name,
                message: err.response?.data?.message || 'Error',
                status: 'error',
                time: new Date().toLocaleTimeString()
            });
        }

        // Wait 5 seconds before allowing another scan
        setTimeout(() => {
            setScanCooldown(false);
            setLastScanResult(null);
            setIdentityVerified(false);
        }, 5000);
    };

    // Auto-countdown effect for modal
    useEffect(() => {
        let timer;
        if (pendingChoice && actionCountdown > 0) {
            timer = setInterval(() => {
                setActionCountdown(prev => prev - 1);
            }, 1000);
        } else if (pendingChoice && actionCountdown === 0) {
            // Cancel and resume scanning if no action taken
            setPendingChoice(null);
            setTimeout(() => setScanCooldown(false), 2000);
        }
        return () => clearInterval(timer);
    }, [pendingChoice, actionCountdown]);

    const captureSnapshot = () => {
        if (!videoRef.current) return null;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const getCurrentLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) { resolve(null); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                { timeout: 5000 }
            );
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
                <RefreshCw className="animate-spin mb-4 text-blue-500" size={48} />
                <h2 className="text-2xl font-black">Initializing Kiosk Mode</h2>
                <p className="text-slate-400 mt-2">Loading AI models and employee database...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-start z-[2000] p-4 sm:p-8 lg:p-12 overflow-y-auto overflow-x-hidden pt-24 sm:pt-32">
            {/* Header */}
            <div className="absolute top-4 sm:top-8 left-4 sm:left-8 right-4 sm:right-8 flex flex-row justify-between items-center z-10 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)]">
                <button 
                    onClick={() => navigate('/admin')} 
                    className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl text-white transition-colors flex items-center gap-1 sm:gap-2 font-bold text-xs sm:text-base border border-white/10"
                >
                    <ArrowLeft size={16} /> <span className="hidden xs:inline">Exit Kiosk</span><span className="xs:hidden">Exit</span>
                </button>
                <div className="flex flex-col items-end">
                    <h1 className="text-white text-lg sm:text-3xl font-black tracking-tighter uppercase italic flex items-center gap-1 sm:gap-2">
                        <Zap className="text-blue-500 fill-blue-500" size={18} /> Trackify
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[7px] sm:text-[10px]">Biometric Attendance Station</p>
                </div>
            </div>

            {/* Action Selection Modal (Option 3) */}
            {pendingChoice && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300"></div>
                    
                    <div className="relative w-full max-w-lg bg-slate-900 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        {/* Countdown Bar */}
                        <div className="absolute top-0 left-0 h-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-linear" style={{ width: `${(actionCountdown / 5) * 100}%` }}></div>

                        <div className="p-8 sm:p-12 text-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                                <UserCheck size={48} className="text-white" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">Hi, {pendingChoice.employee.name}!</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">What would you like to do?</p>

                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => handleMatchFound(pendingChoice.employee._id, 'break')}
                                    className="group relative bg-orange-600 hover:bg-orange-500 text-white py-5 px-8 rounded-2xl font-black text-lg uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-lg shadow-orange-600/20 overflow-hidden"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Zap size={24} />
                                        <span>{pendingChoice.status === 'on_break' ? 'Finish Break' : 'Take Break'}</span>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => handleMatchFound(pendingChoice.employee._id, 'attendance')}
                                    className="group relative bg-white/5 hover:bg-white/10 text-white py-5 px-8 rounded-2xl font-black text-lg uppercase tracking-widest transition-all duration-200 active:scale-95 border border-white/10"
                                >
                                    <div className="flex items-center justify-center gap-3 text-slate-300">
                                        <ArrowLeft size={24} />
                                        <span>Clock Out</span>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-8 flex flex-col items-center gap-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Auto-cancel in {actionCountdown}s</p>
                                <button onClick={() => setPendingChoice(null)} className="text-slate-400 hover:text-white text-xs font-black uppercase underline underline-offset-4 decoration-2">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Area */}
            <div className="w-full max-w-2xl relative mt-16 sm:mt-0 px-2">
                <div className={`relative aspect-square md:aspect-[4/3] bg-slate-900 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-4 sm:border-8 transition-all duration-300 ${lastScanResult ? (lastScanResult.status === 'success' ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 'border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.3)]') : (faceDetected ? 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)]' : 'border-slate-800 shadow-2xl')}`}>
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-all duration-700 ${faceDetected ? 'grayscale-0 scale-100' : 'grayscale-[0.5] scale-[1.02]'}`} />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                    
                    {/* Scan Animation Overlay */}
                    {!lastScanResult && (
                        <div className="absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_infinite]"></div>
                    )}

                    {/* Mask Overlay */}
                    <div className="absolute inset-0 border-[40px] border-slate-950/20 pointer-events-none"></div>

                    {/* Result Overlay */}
                    {lastScanResult && (
                        <div className={`absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 text-white animate-in fade-in zoom-in duration-300 ${lastScanResult.status === 'success' ? 'bg-green-600/60' : 'bg-rose-600/60'}`}>
                            <div className="bg-white rounded-full p-3 sm:p-4 mb-3 sm:mb-6 shadow-2xl">
                                {lastScanResult.status === 'success' ? <UserCheck size={48} className="text-green-600" /> : <ShieldCheck size={48} className="text-rose-600" />}
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-1 sm:mb-2 text-center">{lastScanResult.name}</h2>
                            <p className="text-sm sm:text-xl font-bold uppercase tracking-widest opacity-90 mb-3 sm:mb-6 text-center">{lastScanResult.message}</p>
                            <span className="px-6 py-2 bg-black/20 rounded-full font-black text-sm">{lastScanResult.time}</span>
                            <div className="mt-8 flex items-center gap-2 text-white/50 animate-pulse text-sm font-bold uppercase tracking-widest">
                                <RefreshCw size={14} className="animate-spin" /> Next scan in 5s
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Indicator */}
                {!lastScanResult && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max max-w-[90vw]">
                        <div className={`px-4 sm:px-10 py-2 sm:py-4 rounded-full flex items-center gap-2 sm:gap-3 backdrop-blur-xl border-2 transition-all duration-300 ${identityVerified ? 'bg-green-500/20 border-green-500 text-green-400' : (faceDetected ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-500/20 border-slate-500 text-slate-400')}`}>
                            {identityVerified ? <UserCheck size={16} sm:size={20} /> : <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/20 border-t-white rounded-full"></div>}
                            <span className="text-xs sm:text-base font-black uppercase tracking-widest">
                                {identityVerified ? 'Identity Found' : (faceDetected ? 'No Face Found' : 'Waiting for Face...')}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Info */}
            <div className="mt-12 sm:mt-20 flex flex-col items-center gap-4 w-full">
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-6 sm:gap-12 w-full max-w-xl">
                    <div className="text-center">
                        <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                        <div className="flex items-center justify-center gap-2 text-emerald-500 font-black italic text-[10px] sm:text-base">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-ping"></div> ACTIVE
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Database</p>
                        <p className="text-white font-black italic text-[10px] sm:text-base uppercase">{employees.length} Users</p>
                    </div>
                    <div className="text-center col-span-2 xs:col-span-1">
                        <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">Method</p>
                        <p className="text-white font-black italic text-[10px] sm:text-base uppercase tracking-tighter">Biometric</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
            `}} />
        </div>
    );
}
