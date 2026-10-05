import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Activity, 
  Sparkles, 
  Compass,
  ArrowRightLeft,
  Magnet,
  Maximize2,
  Lightbulb,
  Zap,
  Radio,
  Waves,
  BookOpen
} from 'lucide-react';
import { sound } from '../../services/sound';

export type PhysicsModel = 
  | 'spring'       // الوحدة الأولى : الحركة التوافقية والنواس المرن
  | 'torsion'      // الوحدة الأولى : نواس الفتل
  | 'compound'     // الوحدة الأولى : النواس الثقلي المركب والبسيط
  | 'laplace'      // الوحدة الثانية : السكتين وقوة لابلاس
  | 'induction'    // الوحدة الثانية : التحريض الكهرطيسي وتجربة فرداي ولنز
  | 'resonance'    // الوحدة الثانية : التيار المتناوب الجيبي ودارة RLC والتجاوب
  | 'melde';       // الوحدة الثالثة : الأمواج المستقرة وتجربة ميلد

export const PhysicsSimulator: React.FC = () => {
  const [activeModel, setActiveModel] = useState<PhysicsModel>('spring');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  
  // 1. Spring Parameters
  const [springMass, setSpringMass] = useState<number>(0.2); // kg
  const [springK, setSpringK] = useState<number>(20); // N/m
  const [springXmax, setSpringXmax] = useState<number>(0.08); // m
  const [springOrientation, setSpringOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // 2. Torsion Parameters
  const [torsionK, setTorsionK] = useState<number>(0.02); // N·m/rad
  const [torsionMass, setTorsionMass] = useState<number>(0.1); // kg
  const [torsionDist, setTorsionDist] = useState<number>(0.15); // m
  const [torsionThetaMax, setTorsionThetaMax] = useState<number>(0.35); // rad

  // 3. Compound & Simple Gravity Pendulum
  const [rodLength, setRodLength] = useState<number>(1.0); // m
  const [rodMass, setRodMass] = useState<number>(0.6); // kg
  const [suspensionDistD, setSuspensionDistD] = useState<number>(0.3); // m from G
  const [gravityG, setGravityG] = useState<number>(10); // m/s^2

  // 4. Laplace Rails Parameters
  const [laplaceCurrent, setLaplaceCurrent] = useState<number>(5); // A
  const [laplaceB, setLaplaceB] = useState<number>(0.04); // T
  const [laplaceLength, setLaplaceLength] = useState<number>(0.1); // m
  const [laplaceDirection, setLaplaceDirection] = useState<'forward' | 'reverse'>('forward');

  // 5. Electromagnetic Induction (Faraday & Lenz)
  const [magnetSpeed, setMagnetSpeed] = useState<number>(1.2); // m/s
  const [coilTurns, setCoilTurns] = useState<number>(100); // N
  const [magnetStrength, setMagnetStrength] = useState<number>(0.05); // T

  // 6. RLC AC Resonance Circuit
  const [circuitR, setCircuitR] = useState<number>(20); // Ohm
  const [circuitL, setCircuitL] = useState<number>(0.2); // H
  const [circuitC, setCircuitC] = useState<number>(50); // microFarad
  const [sourceFreq, setSourceFreq] = useState<number>(50); // Hz
  const [sourceUeff, setSourceUeff] = useState<number>(100); // V

  // 7. Melde Standing Waves
  const [waveLoops, setWaveLoops] = useState<number>(3); // k = 1, 2, 3, 4, 5
  const [stringLength, setStringLength] = useState<number>(1.2); // m
  const [waveFreq, setWaveFreq] = useState<number>(50); // Hz

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<number>(0);
  const laplacePosRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // --- Calculations for Models ---
  // Spring
  const springOmega = Math.sqrt(springK / springMass);
  const springT0 = (2 * Math.PI) / springOmega;
  const springEnergy = 0.5 * springK * springXmax * springXmax;

  // Torsion (I_total = I_rod0 + 2 * m' * d^2)
  const I_rod0 = 0.001; // kg·m^2
  const I_torsionTotal = I_rod0 + 2 * torsionMass * torsionDist * torsionDist;
  const torsionOmega = Math.sqrt(torsionK / I_torsionTotal);
  const torsionT0 = 2 * Math.PI * Math.sqrt(I_torsionTotal / torsionK);

  // Compound Pendulum (I_delta = (1/12) m L^2 + m d^2)
  const I_G_rod = (1 / 12) * rodMass * rodLength * rodLength;
  const I_delta_compound = I_G_rod + rodMass * suspensionDistD * suspensionDistD;
  const compoundOmega = Math.sqrt((rodMass * gravityG * suspensionDistD) / I_delta_compound);
  const compoundT0 = 2 * Math.PI * Math.sqrt(I_delta_compound / (rodMass * gravityG * suspensionDistD));
  const synchronousLengthL = I_delta_compound / (rodMass * suspensionDistD);

  // Laplace Force F = I * L * B
  const laplaceForce = Math.abs(laplaceCurrent) * laplaceLength * Math.abs(laplaceB);

  // RLC Resonance calculations
  const omegaAC = 2 * Math.PI * sourceFreq;
  const CapFarad = circuitC * 1e-6;
  const Z_L = circuitL * omegaAC;
  const Z_C = 1 / (CapFarad * omegaAC);
  const impedanceZ = Math.sqrt(circuitR * circuitR + Math.pow(Z_L - Z_C, 2));
  const I_eff = sourceUeff / impedanceZ;
  const f_resonance = 1 / (2 * Math.PI * Math.sqrt(circuitL * CapFarad));
  const isResonanceActive = Math.abs(sourceFreq - f_resonance) < 2.5;

  // Melde wave calculations
  const waveLengthLambda = (2 * stringLength) / waveLoops;
  const waveSpeedV = waveFreq * waveLengthLambda;

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isRunning) {
        timeRef.current += dt;
      }

      const t = timeRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Dark laboratory canvas background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = '#141d2e';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render based on selected physics model
      if (activeModel === 'spring') {
        // --- 1. SPRING HARMONIC OSCILLATOR ---
        const x = springXmax * Math.cos(springOmega * t);
        const v = -springXmax * springOmega * Math.sin(springOmega * t);
        const Ep = 0.5 * springK * x * x;
        const Ek = 0.5 * springMass * v * v;

        if (springOrientation === 'horizontal') {
          const centerY = height / 2 - 15;
          const originX = width / 2;
          const scale = 700;
          const bobX = originX + x * scale;

          // Equilibrium line
          ctx.strokeStyle = '#334155';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(originX, centerY - 50);
          ctx.lineTo(originX, centerY + 50);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#64748b';
          ctx.font = '10px sans-serif';
          ctx.fillText('موضع التوازن (x = 0)', originX - 35, centerY + 65);

          // Wall mount
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(40, centerY - 35, 12, 70);

          // Spring
          const springStartX = 52;
          const coils = 16;
          const springWidth = bobX - springStartX - 20;
          const coilStep = springWidth / coils;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(springStartX, centerY);
          for (let i = 0; i < coils; i++) {
            const cx = springStartX + (i + 0.5) * coilStep;
            const cy = i % 2 === 0 ? centerY - 14 : centerY + 14;
            ctx.lineTo(cx, cy);
          }
          ctx.lineTo(bobX - 18, centerY);
          ctx.stroke();

          // Metallic Bob
          const radius = 18;
          const grad = ctx.createRadialGradient(bobX - 4, centerY - 4, 3, bobX, centerY, radius);
          grad.addColorStop(0, '#818cf8');
          grad.addColorStop(1, '#4338ca');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(bobX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#c7d2fe';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${springMass}kg`, bobX, centerY + 3);
          ctx.textAlign = 'start';
        } else {
          // Vertical spring
          const centerX = width / 2;
          const startY = 30;
          const originY = height / 2 - 20;
          const scale = 700;
          const bobY = originY + x * scale;

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(centerX - 40, startY - 10, 80, 10);

          const coils = 16;
          const springHeight = bobY - startY - 20;
          const coilStep = springHeight / coils;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(centerX, startY);
          for (let i = 0; i < coils; i++) {
            const cy = startY + (i + 0.5) * coilStep;
            const cx = i % 2 === 0 ? centerX - 14 : centerX + 14;
            ctx.lineTo(cx, cy);
          }
          ctx.lineTo(centerX, bobY - 18);
          ctx.stroke();

          const radius = 18;
          ctx.fillStyle = '#4f46e5';
          ctx.beginPath();
          ctx.arc(centerX, bobY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a5b4fc';
          ctx.stroke();
        }

        // Energy bars
        const barY = height - 25;
        const barMaxWidth = 160;
        const ekWidth = springEnergy > 0 ? (Ek / springEnergy) * barMaxWidth : 0;
        const epWidth = springEnergy > 0 ? (Ep / springEnergy) * barMaxWidth : 0;

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`Ek = ${Ek.toFixed(3)} J`, 40, barY - 10);
        ctx.fillStyle = '#06b6d4';
        ctx.fillText(`Ep = ${Ep.toFixed(3)} J`, width - 180, barY - 10);

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(40, barY, ekWidth, 8);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(width - 180, barY, epWidth, 8);

      } else if (activeModel === 'torsion') {
        // --- 2. TORSION PENDULUM ---
        const theta = torsionThetaMax * Math.cos(torsionOmega * t);
        const centerX = width / 2;
        const centerY = height / 2 + 10;
        const rodLengthPx = 260;

        // Top ceiling & torsion wire
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(centerX - 30, 20, 60, 8);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX, 28);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px sans-serif';
        ctx.fillText(`سلك فتل (K = ${torsionK} N·m/rad)`, centerX + 8, 70);

        // Rod rotating
        const angle = theta;
        const x1 = centerX - (rodLengthPx / 2) * Math.cos(angle);
        const y1 = centerY - (rodLengthPx / 6) * Math.sin(angle);
        const x2 = centerX + (rodLengthPx / 2) * Math.cos(angle);
        const y2 = centerY + (rodLengthPx / 6) * Math.sin(angle);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // The two adjustment masses
        const massDistPixels = (torsionDist / 0.25) * (rodLengthPx / 2) * 0.9;
        const mx1 = centerX - massDistPixels * Math.cos(angle);
        const my1 = centerY - massDistPixels * Math.sin(angle);
        const mx2 = centerX + massDistPixels * Math.cos(angle);
        const my2 = centerY + massDistPixels * Math.sin(angle);

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(mx1, my1, 12, 0, Math.PI * 2);
        ctx.arc(mx2, my2, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fbcfe8';
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.fillText(`سعة الزاوية θ = ${(theta * 180 / Math.PI).toFixed(1)}°`, 30, height - 20);
        ctx.fillText(`الدور T₀ = ${torsionT0.toFixed(2)} s (يزداد بزيادة d)`, width - 200, height - 20);

      } else if (activeModel === 'compound') {
        // --- 3. COMPOUND & SIMPLE GRAVITY PENDULUM (النواس الثقلي) ---
        const theta = 0.3 * Math.cos(compoundOmega * t);
        const pivotX = width / 2;
        const pivotY = 40;
        const scalePx = 180;

        // Draw axis of rotation Δ
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px sans-serif';
        ctx.fillText('محور الدوران Δ', pivotX + 10, pivotY - 2);

        // Distance d to G, and rest of rod
        const rodLengthVis = rodLength * scalePx;
        const distDVis = suspensionDistD * scalePx;

        // Rod coordinates
        // Pivot is at distD from center G, so top of rod is pivot - (L/2 - d)
        const topDist = (rodLengthVis / 2 - distDVis);
        const bottomDist = (rodLengthVis / 2 + distDVis);

        const topX = pivotX - topDist * Math.sin(theta);
        const topY = pivotY - topDist * Math.cos(theta);
        const bottomX = pivotX + bottomDist * Math.sin(theta);
        const bottomY = pivotY + bottomDist * Math.cos(theta);
        const gX = pivotX + distDVis * Math.sin(theta);
        const gY = pivotY + distDVis * Math.cos(theta);

        // Draw Rod
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.lineTo(bottomX, bottomY);
        ctx.stroke();

        // Center of Gravity G (Red dot)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(gX, gY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.font = '10px sans-serif';
        ctx.fillText('مركز الثقل G', gX + 10, gY + 3);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.fillText(`الدور T₀ = ${compoundT0.toFixed(2)} s`, 30, height - 20);
        ctx.fillText(`طول النواس البسيط الموافق L' = ${synchronousLengthL.toFixed(2)} m`, width - 230, height - 20);

      } else if (activeModel === 'laplace') {
        // --- 4. LAPLACE RAILS ---
        const railsY1 = height / 2 - 40;
        const railsY2 = height / 2 + 40;
        const railsStartX = 80;
        const railsEndX = width - 80;

        const forceDir = laplaceDirection === 'forward' ? 1 : -1;
        if (isRunning) {
          laplacePosRef.current += forceDir * (laplaceForce * 80) * dt;
          if (laplacePosRef.current > (railsEndX - railsStartX - 40)) {
            laplacePosRef.current = 0;
          } else if (laplacePosRef.current < 0) {
            laplacePosRef.current = railsEndX - railsStartX - 40;
          }
        }

        const rodX = railsStartX + 20 + laplacePosRef.current;

        // Magnetic Field B (⊗)
        ctx.fillStyle = '#1e3a8a';
        ctx.font = '14px monospace';
        for (let bx = railsStartX + 20; bx < railsEndX - 10; bx += 35) {
          for (let by = railsY1 - 25; by < railsY2 + 35; by += 25) {
            ctx.fillText('⊗', bx, by);
          }
        }
        ctx.fillStyle = '#60a5fa';
        ctx.font = '10px sans-serif';
        ctx.fillText(`حقل مغناطيسي منتظم B = ${laplaceB} T (نحو الداخل ⊗)`, railsStartX, railsY1 - 40);

        // Rails
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(railsStartX, railsY1);
        ctx.lineTo(railsEndX, railsY1);
        ctx.moveTo(railsStartX, railsY2);
        ctx.lineTo(railsEndX, railsY2);
        ctx.stroke();

        // Generator connection
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(railsStartX, railsY1);
        ctx.lineTo(railsStartX - 30, railsY1);
        ctx.lineTo(railsStartX - 30, railsY2);
        ctx.lineTo(railsStartX, railsY2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`تيار I = ${laplaceCurrent} A`, railsStartX - 70, (railsY1 + railsY2) / 2 + 4);

        // Rolling Rod
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rodX, railsY1 - 10);
        ctx.lineTo(rodX, railsY2 + 10);
        ctx.stroke();

        // Laplace Force Vector Arrow
        const arrowLen = 50 * forceDir;
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rodX, (railsY1 + railsY2) / 2);
        ctx.lineTo(rodX + arrowLen, (railsY1 + railsY2) / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rodX + arrowLen, (railsY1 + railsY2) / 2);
        ctx.lineTo(rodX + arrowLen - (forceDir * 8), (railsY1 + railsY2) / 2 - 5);
        ctx.lineTo(rodX + arrowLen - (forceDir * 8), (railsY1 + railsY2) / 2 + 5);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`قوة لابلاس F = ${laplaceForce.toFixed(3)} N`, rodX - 30, (railsY1 + railsY2) / 2 - 12);

      } else if (activeModel === 'induction') {
        // --- 5. ELECTROMAGNETIC INDUCTION (FARADAY & LENZ) ---
        const coilCenterX = width / 2 + 80;
        const coilCenterY = height / 2;
        const coilRadius = 45;
        const coilLoops = 8;

        // Magnet moving in and out with sine wave
        const magnetOsc = Math.sin(magnetSpeed * t * 3);
        const magnetVelocity = magnetSpeed * 3 * Math.cos(magnetSpeed * t * 3);
        const magnetX = coilCenterX - 180 + magnetOsc * 70;
        const magnetY = coilCenterY;

        // Induced EMF e = - N * dPhi/dt
        const inducedEmf = -coilTurns * magnetStrength * magnetVelocity * 0.05;
        const currentMagnitude = Math.abs(inducedEmf);

        // Draw Solenoid (Coil)
        ctx.strokeStyle = '#d97706'; // Copper wire
        ctx.lineWidth = 4;
        for (let i = 0; i < coilLoops; i++) {
          const cx = coilCenterX - 50 + i * 14;
          ctx.beginPath();
          ctx.ellipse(cx, coilCenterY, 8, coilRadius, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px sans-serif';
        ctx.fillText(`وشيعة (N = ${coilTurns} لفة)`, coilCenterX - 35, coilCenterY - coilRadius - 10);

        // Draw Galvanometer / Voltmeter with swinging needle
        const galvX = coilCenterX;
        const galvY = coilCenterY + 95;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(galvX, galvY, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Galvanometer Needle (Deflection depends on induced EMF / Lenz's law)
        const needleAngle = Math.max(-1.1, Math.min(1.1, inducedEmf * 1.5));
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(galvX, galvY + 10);
        ctx.lineTo(galvX + 26 * Math.sin(needleAngle), galvY + 10 - 26 * Math.cos(needleAngle));
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px monospace';
        ctx.fillText('مقياس G', galvX - 16, galvY + 22);

        // Connect wires from coil to galvanometer
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(coilCenterX - 50, coilCenterY + coilRadius);
        ctx.lineTo(coilCenterX - 50, galvY);
        ctx.lineTo(galvX - 32, galvY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(coilCenterX + 50, coilCenterY + coilRadius);
        ctx.lineTo(coilCenterX + 50, galvY);
        ctx.lineTo(galvX + 32, galvY);
        ctx.stroke();

        // Draw Moving Bar Magnet
        const magW = 90;
        const magH = 32;

        // North pole (Red)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(magnetX, magnetY - magH / 2, magW / 2, magH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('N', magnetX + 15, magnetY + 4);

        // South pole (Blue)
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(magnetX - magW / 2, magnetY - magH / 2, magW / 2, magH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('S', magnetX - magW / 2 + 15, magnetY + 4);

        // Indicator Light Bulb (Glows when induced current flows)
        const bulbX = 60;
        const bulbY = coilCenterY;
        const glowAlpha = Math.min(1.0, currentMagnitude * 2);
        ctx.fillStyle = `rgba(250, 204, 21, ${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText('مصباح التوهج', bulbX - 25, bulbY + 30);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.fillText(`قانون لنز: جهة التيار المتحرض تعاكس السبب الذي أدى لحدوثه`, 30, height - 20);
        ctx.fillText(`القوة المحركة المتحرضة e = - dΦ/dt = ${(inducedEmf * 10).toFixed(2)} V`, width - 280, height - 20);

      } else if (activeModel === 'resonance') {
        // --- 6. RLC AC CIRCUIT & RESONANCE (التيار المتناوب الجيبي والتجاوب) ---
        // Left: Plot of I_eff versus frequency f
        const plotX = 50;
        const plotY = height - 50;
        const plotW = width - 100;
        const plotH = 180;

        // Axes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(plotX, plotY);
        ctx.lineTo(plotX + plotW, plotY);
        ctx.moveTo(plotX, plotY);
        ctx.lineTo(plotX, plotY - plotH);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('تواتر المنبع f (Hz)', plotX + plotW - 70, plotY + 16);
        ctx.fillText('الشدة الفعالة I_eff (A)', plotX + 10, plotY - plotH + 10);

        // Draw Resonance Curve
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const fMin = 10;
        const fMax = 120;
        const I_max = sourceUeff / circuitR; // at resonance Z = R

        for (let f = fMin; f <= fMax; f += 1) {
          const w = 2 * Math.PI * f;
          const zL = circuitL * w;
          const zC = 1 / (CapFarad * w);
          const z = Math.sqrt(circuitR * circuitR + Math.pow(zL - zC, 2));
          const iEff = sourceUeff / z;

          const px = plotX + ((f - fMin) / (fMax - fMin)) * plotW;
          const py = plotY - (iEff / (I_max * 1.15)) * plotH;

          if (f === fMin) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Current frequency cursor dot
        const currentPx = plotX + ((sourceFreq - fMin) / (fMax - fMin)) * plotW;
        const currentPy = plotY - (I_eff / (I_max * 1.15)) * plotH;

        ctx.fillStyle = isResonanceActive ? '#10b981' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(currentPx, currentPy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Resonance peak indicator dashed line
        const resPx = plotX + ((f_resonance - fMin) / (fMax - fMin)) * plotW;
        ctx.strokeStyle = '#10b981';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(resPx, plotY);
        ctx.lineTo(resPx, plotY - plotH + 20);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`تواتر التجاوب f₀ = ${f_resonance.toFixed(1)} Hz`, resPx - 45, plotY - plotH + 12);

        // Header info
        ctx.fillStyle = isResonanceActive ? '#34d399' : '#cbd5e1';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(
          isResonanceActive
            ? '⚡ حالة تجاوب كهربائي (Resonance): Lω = 1/Cω، الممانعة صغرى Z = R، والشدة عظمى!'
            : `الممانعة الكلية للدارة Z = ${impedanceZ.toFixed(1)} Ω | الشدة الفعالة I_eff = ${I_eff.toFixed(2)} A`,
          50,
          35
        );

      } else if (activeModel === 'melde') {
        // --- 7. MELDE STANDING WAVES (الأمواج المستقرة وتجربة ميلد) ---
        const startX = 60;
        const endX = width - 60;
        const centerY = height / 2;
        const stringLenPx = endX - startX;

        // Vibrator at the left
        const vibratorOsc = Math.sin(waveFreq * t * 2 * Math.PI) * 10;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(startX - 25, centerY - 25, 25, 50);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX - 20, centerY);
        ctx.lineTo(startX, centerY + vibratorOsc);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = '10px sans-serif';
        ctx.fillText('منبع اهتزاز', startX - 30, centerY - 32);

        // Pulley at the right
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(endX + 15, centerY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Hanging mass (F_s = M * g)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(endX + 15, centerY);
        ctx.lineTo(endX + 15, centerY + 50);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(endX + 5, centerY + 50, 20, 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.fillText('ثقل M', endX + 6, centerY + 65);

        // Draw Standing Wave with k loops
        const waveTimeOsc = Math.cos(2 * Math.PI * waveFreq * t);
        const maxAmpPx = 28;

        // Envelope glow
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let px = 0; px <= stringLenPx; px += 2) {
          const xNorm = px / stringLenPx;
          const yOffset = maxAmpPx * Math.sin(waveLoops * Math.PI * xNorm) * waveTimeOsc;
          if (px === 0) ctx.moveTo(startX + px, centerY + yOffset);
          else ctx.lineTo(startX + px, centerY + yOffset);
        }
        ctx.stroke();

        // Draw Ghost/Opposite phase wave to show loop visually
        ctx.strokeStyle = '#0284c7';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let px = 0; px <= stringLenPx; px += 2) {
          const xNorm = px / stringLenPx;
          const yOffset = -maxAmpPx * Math.sin(waveLoops * Math.PI * xNorm) * waveTimeOsc;
          if (px === 0) ctx.moveTo(startX + px, centerY + yOffset);
          else ctx.lineTo(startX + px, centerY + yOffset);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Mark Nodes (عقد الاهتزاز) and Antinodes (بطون الاهتزاز)
        for (let loop = 0; loop <= waveLoops; loop++) {
          const nodeX = startX + (loop / waveLoops) * stringLenPx;
          // Node dot
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(nodeX, centerY, 4, 0, Math.PI * 2);
          ctx.fill();

          if (loop < waveLoops) {
            // Antinode center
            const antinodeX = startX + ((loop + 0.5) / waveLoops) * stringLenPx;
            ctx.fillStyle = '#fbbf24';
            ctx.font = '9px sans-serif';
            ctx.fillText('بطن', antinodeX - 8, centerY - maxAmpPx - 6);
          }
        }

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.fillText(`طول الوتر L = k · (λ / 2) | عدد المغازل k = ${waveLoops} مغازل`, 30, height - 20);
        ctx.fillText(`طول الموجة λ = ${waveLengthLambda.toFixed(2)} m | السرعة v = ${waveSpeedV.toFixed(1)} m/s`, width - 260, height - 20);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    isRunning, 
    activeModel, 
    springMass, 
    springK, 
    springXmax, 
    springOrientation,
    torsionK, 
    torsionMass, 
    torsionDist, 
    torsionThetaMax,
    rodLength,
    rodMass,
    suspensionDistD,
    gravityG,
    laplaceCurrent, 
    laplaceB, 
    laplaceLength, 
    laplaceDirection,
    magnetSpeed,
    coilTurns,
    magnetStrength,
    circuitR,
    circuitL,
    circuitC,
    sourceFreq,
    sourceUeff,
    waveLoops,
    stringLength,
    waveFreq,
    springOmega,
    springEnergy,
    torsionOmega,
    torsionT0,
    compoundOmega,
    compoundT0,
    synchronousLengthL,
    laplaceForce,
    impedanceZ,
    I_eff,
    f_resonance,
    isResonanceActive,
    waveLengthLambda,
    waveSpeedV
  ]);

  const handleToggleRun = () => {
    sound.button();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    sound.button();
    timeRef.current = 0;
    laplacePosRef.current = 0;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4" dir="rtl">
      {/* Top Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-600/10">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>مختبر الفيزياء التفاعلي لمنهاج البكالوريا</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono">
                7 تجارب وزارية
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              محاكاة بصرية تفاعلية دقيقة لتجارب المنهاج: النواسات، لابلاس، التحريض الكهرطيسي، التيار المتناوب، وتجربة ميلد
            </p>
          </div>
        </div>
      </div>

      {/* Syllabus Units Categories Tabs */}
      <div className="p-2 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>اختر التجربة الفيزيائية من وحدات الكتاب الوزاري:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
          <button
            onClick={() => { setActiveModel('spring'); sound.button(); }}
            className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
              activeModel === 'spring'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="text-[10px] text-indigo-300 font-sans">وحدة 1 • درس 1</div>
            <div className="font-bold truncate mt-0.5">النواس المرن</div>
          </button>

          <button
            onClick={() => { setActiveModel('torsion'); sound.button(); }}
            className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
              activeModel === 'torsion'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="text-[10px] text-indigo-300 font-sans">وحدة 1 • درس 2</div>
            <div className="font-bold truncate mt-0.5">نواس الفتل</div>
          </button>

          <button
            onClick={() => { setActiveModel('compound'); sound.button(); }}
            className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
              activeModel === 'compound'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="text-[10px] text-indigo-300 font-sans">وحدة 1 • درس 3</div>
            <div className="font-bold truncate mt-0.5">النواس الثقلي</div>
          </button>

          <button
            onClick={() => { setActiveModel('laplace'); sound.button(); }}
            className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
              activeModel === 'laplace'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="text-[10px] text-indigo-300 font-sans">وحدة 2 • درس 2</div>
            <div className="font-bold truncate mt-0.5">قوة لابلاس</div>
          </button>

          <button
            onClick={() => { setActiveModel('induction'); sound.button(); }}
            className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
              activeModel === 'induction'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="text-[10px] text-indigo-300 font-sans">وحدة 2 • درس 3</div>
            <div className="font-bold truncate mt-0.5">التحريض ولنز</div>
          </button>

          <button
            onClick={() => { setActiveModel('resonance'); sound.button(); }}
            className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
              activeModel === 'resonance'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="text-[10px] text-indigo-300 font-sans">وحدة 2 • درس 5</div>
            <div className="font-bold truncate mt-0.5">دارة RLC والتجاوب</div>
          </button>

          <button
            onClick={() => { setActiveModel('melde'); sound.button(); }}
            className={`p-2 rounded-xl text-xs font-bold text-center border transition-all ${
              activeModel === 'melde'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <div className="text-[10px] text-indigo-300 font-sans">وحدة 3 • درس 1</div>
            <div className="font-bold truncate mt-0.5">تجربة ميلد للأمواج</div>
          </button>
        </div>
      </div>

      {/* Main Grid: Simulation & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Canvas Section (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-3 relative shadow-2xl flex flex-col justify-between">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleRun}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning ? 'إيقاف مؤقت' : 'تشغيل الحركة'}</span>
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                title="إعادة ضبط التجربة"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {activeModel === 'spring' && `T₀ = ${springT0.toFixed(2)} s`}
              {activeModel === 'torsion' && `T₀ = ${torsionT0.toFixed(2)} s`}
              {activeModel === 'compound' && `T₀ = ${compoundT0.toFixed(2)} s`}
              {activeModel === 'laplace' && `F = ${laplaceForce.toFixed(3)} N`}
              {activeModel === 'induction' && `e = -dΦ/dt`}
              {activeModel === 'resonance' && `f₀ = ${f_resonance.toFixed(1)} Hz`}
              {activeModel === 'melde' && `λ = ${waveLengthLambda.toFixed(2)} m`}
            </div>
          </div>

          {/* Canvas Box */}
          <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-850 relative">
            <canvas
              ref={canvasRef}
              width={540}
              height={320}
              className="w-full h-full block"
            />
          </div>

          {/* Educational Note */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center justify-between">
            {activeModel === 'spring' && <span>قانون الدور الخاص: T₀ = 2π√(m / k)</span>}
            {activeModel === 'torsion' && <span>نواس الفتل: T₀ = 2π√(I_Δ / K) حيث I_Δ = I_Δ0 + 2m'd²</span>}
            {activeModel === 'compound' && <span>النواس الثقلي المركب: T₀ = 2π√(I_Δ / mgd) ونظرية هايغنز</span>}
            {activeModel === 'laplace' && <span>قوة لابلاس الكهرطيسية: F = I · L · B · sin(θ)</span>}
            {activeModel === 'induction' && <span>قانون فرداي ولنز: e = - dΦ / dt حيث Φ = B · S · cos(α)</span>}
            {activeModel === 'resonance' && <span>شرط التجاوب الكهربائي: Lω = 1/(Cω) وتصبح Z = R أصغرية</span>}
            {activeModel === 'melde' && <span>شرط الأمواج المستقرة العرضية: L = k · (λ / 2)</span>}
            <span className="text-amber-400 font-bold">منهاج سوريا 2026</span>
          </div>
        </div>

        {/* Sliders Panel (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>ضوابط التجربة الفيزيائية:</span>
          </div>

          {/* 1. Spring */}
          {activeModel === 'spring' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">الوضع:</span>
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 text-[10px]">
                  <button
                    onClick={() => setSpringOrientation('horizontal')}
                    className={`px-2 py-0.5 rounded ${springOrientation === 'horizontal' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    أفقي
                  </button>
                  <button
                    onClick={() => setSpringOrientation('vertical')}
                    className={`px-2 py-0.5 rounded ${springOrientation === 'vertical' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    شاقولي
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">كتلة الجسم (m):</span>
                  <span className="text-indigo-400 font-mono">{springMass} kg</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={springMass}
                  onChange={(e) => setSpringMass(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">صلابة النابض (k):</span>
                  <span className="text-cyan-400 font-mono">{springK} N/m</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={springK}
                  onChange={(e) => setSpringK(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 2. Torsion */}
          {activeModel === 'torsion' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">بعد الكتلتين (d):</span>
                  <span className="text-amber-400 font-mono">{(torsionDist * 100).toFixed(0)} cm</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.22"
                  step="0.01"
                  value={torsionDist}
                  onChange={(e) => setTorsionDist(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">كتلة كل من الكتلتين (m'):</span>
                  <span className="text-pink-400 font-mono">{torsionMass * 1000} g</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.25"
                  step="0.01"
                  value={torsionMass}
                  onChange={(e) => setTorsionMass(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 3. Compound Pendulum */}
          {activeModel === 'compound' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">طول الساق (L):</span>
                  <span className="text-indigo-400 font-mono">{rodLength} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={rodLength}
                  onChange={(e) => setRodLength(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">بعد محور التعليق عن المركز (d):</span>
                  <span className="text-amber-400 font-mono">{(suspensionDistD * 100).toFixed(0)} cm</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.45"
                  step="0.05"
                  value={suspensionDistD}
                  onChange={(e) => setSuspensionDistD(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 4. Laplace */}
          {activeModel === 'laplace' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">شدة التيار الكهربائي (I):</span>
                  <span className="text-red-400 font-mono">{laplaceCurrent} A</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={laplaceCurrent}
                  onChange={(e) => setLaplaceCurrent(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setLaplaceDirection(laplaceDirection === 'forward' ? 'reverse' : 'forward')}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-750 text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>عكس جهة التيار ({laplaceDirection === 'forward' ? 'يمين ➔' : 'يسار ⬅'})</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Induction */}
          {activeModel === 'induction' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">سرعة حركة المغناطيس:</span>
                  <span className="text-amber-400 font-mono">{magnetSpeed} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.2"
                  value={magnetSpeed}
                  onChange={(e) => setMagnetSpeed(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  كلما زادت سرعة تغير التدفق dΦ/dt، ازدادت القوة المحركة المتحرضة وتوهج المصباح
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">عدد لفات الوشيعة (N):</span>
                  <span className="text-indigo-400 font-mono">{coilTurns} لفة</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="25"
                  value={coilTurns}
                  onChange={(e) => setCoilTurns(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 6. Resonance & RLC */}
          {activeModel === 'resonance' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">تواتر المنبع (f):</span>
                  <span className="text-teal-400 font-mono">{sourceFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="1"
                  value={sourceFreq}
                  onChange={(e) => setSourceFreq(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">حرك التواتر ليصل إلى {f_resonance.toFixed(1)} Hz</span>
                  <button
                    onClick={() => setSourceFreq(Math.round(f_resonance))}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    ضبط التجاوب فورا ⚡
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">ذاتية الوشيعة (L):</span>
                  <span className="text-indigo-400 font-mono">{circuitL} H</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={circuitL}
                  onChange={(e) => setCircuitL(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">سعة المكثفة (C):</span>
                  <span className="text-cyan-400 font-mono">{circuitC} μF</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={circuitC}
                  onChange={(e) => setCircuitC(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 7. Melde Waves */}
          {activeModel === 'melde' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">عدد المغازل (k):</span>
                  <span className="text-amber-400 font-mono">{waveLoops} مغازل</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((k) => (
                    <button
                      key={k}
                      onClick={() => setWaveLoops(k)}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs border transition-all ${
                        waveLoops === k
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      k={k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">طول الوتر (L):</span>
                  <span className="text-indigo-400 font-mono">{stringLength} m</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="2.0"
                  step="0.1"
                  value={stringLength}
                  onChange={(e) => setStringLength(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
