import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, Play, Square, Coffee, Camera, ShieldCheck, Zap, UserCheck } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';

export default function Dashboard() {
    const [time, setTime] = useState(new Date());
    const [attendance, setAttendance] = useState(null);
    const [company, setCompany] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [initializingCamera, setInitializingCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const name = localStorage.getItem('name') || 'Employee';

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        fetchDashboard();

        // Load face-api models
        const loadModels = async () => {
            try {
                const MODEL_URL = 'https://unpkg.com/@vladmandic/face-api/model/';
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                setModelsLoaded(true);
            } catch (err) {
                console.error("Failed to load face-api models", err);
                toast.error("Failed to load AI face models.");
            }
        };
        loadModels();

        return () => clearInterval(timer);
    }, []);

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendance(res.data.todayAttendance);
            setCompany(res.data.company);
            setUserProfile(res.data.user);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let interval = null;
        if (scanning && modelsLoaded && !initializingCamera) {
            interval = setInterval(async () => {
                if (videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                        .withFaceLandmarks()
                        .withFaceDescriptors();
                    
                    const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
                    faceapi.matchDimensions(canvas, displaySize);

                    if (detections && detections.length > 0) {
                        setFaceDetected(true);
                        
                        // Select the most prominent face
                        const prominentFace = detections.sort((a, b) => (b.detection.box.width * b.detection.box.height) - (a.detection.box.width * a.detection.box.height))[0];
                        
                        const resizedDetections = faceapi.resizeResults(prominentFace, displaySize);
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        const box = resizedDetections.detection.box;
                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = 4;
                        ctx.strokeRect(box.x, box.y, box.width, box.height);
                    } else {
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        setFaceDetected(false);
                    }
                }
            }, 300);
        }
        return () => { if (interval) clearInterval(interval); setFaceDetected(false); };
    }, [scanning, modelsLoaded, initializingCamera]);

    // --- CAMERA HANDLER ---
    useEffect(() => {
        const stopStream = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };
        const startCamera = async () => {
            if (!scanning) return;
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
                if (err.name === 'NotAllowedError') {
                    toast.error('Camera blocked. Allow Camera access in URL bar.');
                } else if (err.name === 'NotFoundError') {
                    toast.error('No camera found.');
                } else if (err.name === 'TypeError' && err.message.includes('getUserMedia')) {
                    toast.error('Mobile blocks Camera on HTTP. Use chrome://flags on phone.');
                } else {
                    toast.error(`Camera Error: ${err.message}`);
                }
                setScanning(false);
            } finally {
                setInitializingCamera(false);
            }
        };
        if (scanning) startCamera();
        return () => stopStream();
    }, [scanning]);

    const captureSnapshot = () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return null;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const getCurrentLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                toast.error("Geolocation is not supported by your browser");
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    console.error("Location error:", err);
                    let msg = "Location access denied.";
                    if (err.code === 1) msg = "Please allow location access to continue.";
                    else if (err.code === 2) msg = "Location unavailable.";
                    else if (err.code === 3) msg = "Location timeout.";

                    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                        msg = "Mobile browsers block Location on HTTP. Please use HTTPS link (https://<your-ip>).";
                    }

                    toast.error(msg);
                    resolve(null);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        });
    };

    const performSmartScan = async () => {
        if (isPunchedOut) return toast.error('Shift Ended.');
        if (!modelsLoaded) return toast.error('Initializing AI models... Please wait a moment.');
        if (!userProfile?.attendancePhoto) return toast.error('Attendance photo not uploaded by Admin. Please contact HR.');

        // 1. Check Location Early
        const location = await getCurrentLocation();
        if (!location) return; // Stop if location not provided

        setScanning(true);
        setLoading(true);

        // Prep Reference Image Matcher
        let faceMatcher = null;
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = userProfile.attendancePhoto;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // 1. Pre-process profile photo for better detection match
            const processingCanvas = document.createElement('canvas');
            const ctx = processingCanvas.getContext('2d');
            processingCanvas.width = img.width;
            processingCanvas.height = img.height;
            ctx.filter = 'contrast(1.1) brightness(1.05)'; 
            ctx.drawImage(img, 0, 0);

            // 2. High robustness detection
            let detections = await faceapi.detectAllFaces(processingCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (detections.length === 0) {
                console.warn("SSD failed on profile photo, trying TinyFace high-res...");
                detections = await faceapi.detectAllFaces(processingCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.15 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();
            }

            if (detections.length === 0) {
                toast.error('Could not detect face in registered profile photo. Contact admin to update photo.');
                setScanning(false); setLoading(false);
                return;
            }

            const prominentFace = detections.sort((a, b) => (b.detection.box.width * b.detection.box.height) - (a.detection.box.width * a.detection.box.height))[0];
            
            try {
                const faceCanvas = await faceapi.extractFaces(processingCanvas, [prominentFace]);
                const descriptor = faceCanvas.length > 0 
                    ? await faceapi.computeFaceDescriptor(faceCanvas[0]) 
                    : prominentFace.descriptor;
                faceMatcher = new faceapi.FaceMatcher(descriptor, 0.50);
            } catch (e) {
                faceMatcher = new faceapi.FaceMatcher(prominentFace.descriptor, 0.50);
            }
        } catch (error) {
            console.error("Reference photo processing error:", error);
            toast.error('Error processing registered profile photo.');
            setScanning(false); setLoading(false);
            return;
        }

        // Patience Loop: Wait for up to 60 seconds (Slow Camera Support)
        let ready = false;
        for (let i = 0; i < 120; i++) {
            if (videoRef.current && videoRef.current.readyState === 4) { ready = true; break; }
            await new Promise(r => setTimeout(r, 500));
        }

        if (!ready) {
            toast.error('Hardware timeout. Please refresh.');
            setScanning(false);
            setLoading(false);
            return;
        }

        // Verification Wait (up to 30 seconds)
        let found = false;
        let bestDistance = Infinity;
        for (let i = 0; i < 40; i++) {
            if (videoRef.current && videoRef.current.readyState === 4) {
                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                if (detections && detections.length > 0) {
                    const prominentFace = detections.sort((a, b) => (b.detection.box.width * b.detection.box.height) - (a.detection.box.width * a.detection.box.height))[0];
                    const match = faceMatcher.findBestMatch(prominentFace.descriptor);
                    if (match.distance < bestDistance) bestDistance = match.distance;
                    if (match.distance <= 0.50) { 
                        found = true;
                        await new Promise(r => setTimeout(r, 600)); // Ensure clear shot
                        break;
                    }
                }
            }
            await new Promise(r => setTimeout(r, 500));
        }

        if (!found) {
            toast.error(`Identity mismatch or not detected explicitly. (Best Distance: ${bestDistance.toFixed(2)})`);
            setScanning(false); setLoading(false);
            return;
        }

        const photo = captureSnapshot();
        const endpoint = (!attendance || !attendance.punchIn) ? 'punch-in' : (attendance.breaks?.find(b => !b.breakEnd)) ? 'break/end' : 'punch-out';

        try {
            const token = localStorage.getItem('token');

            // 2. Upload Photo directly to Cloudinary from Frontend
            let uploadedPhotoUrl = photo;
            try {
                const sigRes = await axios.get(`${import.meta.env.VITE_API_URL}/employee/signature`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const { timestamp, signature, apiKey, cloudName } = sigRes.data;

                const formData = new FormData();
                formData.append('file', photo);
                formData.append('api_key', apiKey);
                formData.append('timestamp', timestamp);
                formData.append('signature', signature);
                formData.append('folder', 'trackify/attendance');

                const cloudRes = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
                uploadedPhotoUrl = cloudRes.data.secure_url;
            } catch (err) {
                console.error("Cloudinary Frontend Upload error:", err);
            }

            // 3. Send Punch in request
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/employee/${endpoint}`, {
                photo: uploadedPhotoUrl, location
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(res.data.message);
            fetchDashboard();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setScanning(false); setLoading(false);
        }
    };

    const handleAction = async (endpoint) => {
        // 1. Get Location first
        const location = await getCurrentLocation();
        if (!location) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/employee/${endpoint}`, {
                location
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success(res.data.message);
            fetchDashboard();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatHours = (hours) => {
        if (!hours) return { h: '00h', m: '00m', s: '00s' };
        const totalSecs = Math.round(hours * 3600);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return { h: `${String(h).padStart(2, '0')}h`, m: `${String(m).padStart(2, '0')}m`, s: `${String(s).padStart(2, '0')}s` };
    };

    const isPunchedIn = attendance && attendance.punchIn && !attendance.punchOut;
    const isPunchedOut = attendance && attendance.punchOut;
    const inBreak = attendance && attendance.breaks && attendance.breaks.length > 0 && !attendance.breaks[attendance.breaks.length - 1].breakEnd;
    const workTime = formatHours(attendance?.totalWorkHours);
    const breakTime = formatHours(attendance ? (attendance.totalBreakTime / 60) : 0);

    return (
        <div className="p-4 md:p-8 max-w-8xl space-y-8 relative">
            {scanning && (
                <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center">
                    <div className="relative w-full max-w-md aspect-square bg-slate-800 rounded-3xl overflow-hidden border-4 border-blue-500 shadow-2xl shadow-blue-500/20">
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-all duration-500 ${faceDetected ? 'grayscale-0' : 'grayscale'}`} />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                        <div className="absolute inset-0 border-[20px] border-blue-500/20 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-500/50 shadow-lg shadow-blue-500 animate-[scan_2s_infinite]"></div>

                        <div className="absolute top-6 left-6 right-6 flex items-center justify-center">
                            <div className={`px-6 py-2.5 rounded-full flex items-center gap-2 backdrop-blur-md shadow-xl border-2 transition-all duration-300 ${faceDetected ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'}`}>
                                {faceDetected ? <UserCheck size={18} /> : <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>}
                                <span className="text-sm font-black uppercase tracking-widest">{faceDetected ? 'Identity Verified' : 'Detecting Face...'}</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black mt-8 tracking-tight flex items-center gap-3">
                        <ShieldCheck size={32} className="text-blue-500" /> Biometric AI Security
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Position your face within the frame</p>
                </div>
            )}

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full border-8 border-white opacity-10 blur-xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full border-8 border-white opacity-10 blur-xl"></div>
                <div className="relative z-[9] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Good Morning, {name}</h1>
                        <p className="text-blue-100 font-medium tracking-wide">Shift Target: {company?.openingTime || '--:--'} to {company?.closingTime || '--:--'}</p>
                        {attendance && (
                            <span className={`inline-block mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-inner ${attendance.status === 'Late' ? 'bg-rose-500' : 'bg-blue-500'}`}>
                                Status: {attendance.status}
                            </span>
                        )}
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 text-center min-w-[200px] shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-widest text-blue-100 mb-1">Current Time</p>
                        <p className="text-4xl font-extrabold tracking-tight tabular-nums">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-100 border border-blue-50 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Smart Attendance Scan</h2>
                    <p className="text-slate-500 font-medium mt-1">One-click biometric verification for all actions</p>
                </div>
                <button onClick={performSmartScan} disabled={loading} className={`bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-10 py-5 rounded-[2rem] shadow-xl shadow-blue-500/30 font-black tracking-widest uppercase flex items-center gap-4 transition-all`} >
                    <Zap className="fill-white" size={24} />
                    {isPunchedOut ? 'Shift Ended' : inBreak ? 'Scan to End Break' : isPunchedIn ? 'Scan to Punch Out' : 'Scan to Punch In'}
                </button>
            </div>

            <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Punch In', id: 'punch-in', icon: Play, color: 'green', disabled: isPunchedIn || isPunchedOut },
                    { label: 'Start Break', id: 'break/start', icon: Coffee, color: 'amber', disabled: !isPunchedIn || inBreak },
                    { label: 'End Break', id: 'break/end', icon: Clock, color: 'blue', disabled: !inBreak },
                    { label: 'Punch Out', id: 'punch-out', icon: Square, color: 'rose', disabled: !isPunchedIn || inBreak }
                ].map(action => (
                    <button key={action.id} onClick={() => handleAction(action.id)} disabled={loading || action.disabled} className={`group bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col items-center gap-4 transition-all hover:-translate-y-1 ${!action.disabled ? `text-${action.color}-600 hover:bg-${action.color}-50` : 'opacity-40'}`}>
                        <div className={`h-16 w-16 bg-${action.color}-100 text-${action.color}-600 rounded-full flex items-center justify-center group-hover:bg-${action.color}-600 group-hover:text-white transition-all`}>
                            <action.icon size={28} />
                        </div>
                        <span className="font-bold text-slate-700">{action.label}</span>
                    </button>
                ))}
            </div>

            <h2 className="text-xl font-bold text-slate-800 mt-10">Today's Summary</h2>
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 grid grid-cols-2 lg:grid-cols-5 gap-8 divide-x divide-slate-100 text-center">
                <div><p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Punch In</p><p className="text-2xl font-black text-slate-800 tabular-nums">{formatTime(attendance?.punchIn)}</p></div>
                <div><p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Punch Out</p><p className="text-2xl font-black text-slate-400 tabular-nums">{formatTime(attendance?.punchOut)}</p></div>
                <div><p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Break Time</p><p className="text-2xl font-black text-slate-800 tabular-nums">{breakTime.h} <span className="text-sm font-bold text-slate-500">{breakTime.m} {breakTime.s}</span></p></div>
                <div><p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Work hours</p><p className="text-2xl font-black text-green-600 tabular-nums">{workTime.h} <span className="text-sm font-bold text-green-500/70">{workTime.m} {workTime.s}</span></p></div>
                <div><p className="text-xs font-black tracking-widest text-emerald-500 uppercase mb-2">Day Salary</p><p className="text-2xl font-black text-emerald-600 tabular-nums">{attendance?.earnedSalary ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(attendance.earnedSalary) : '₹0.00'}</p></div>
            </div>
        </div>
    );
}
