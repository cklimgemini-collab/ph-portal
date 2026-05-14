// app.js
// =================================================================
// 🪐 响应式终极太阳系引擎：完美重制版土星环 + 阴影渲染
// =================================================================
const canvas = document.getElementById('universe-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 🌟 开启阴影渲染
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x010205, 0.00025);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 6000);
const isMobile = window.innerWidth < 768;

camera.position.set(0, isMobile ? 180 : 50, isMobile ? 1100 : 650); 
camera.lookAt(0, 0, 0); 

const solarSystemGroup = new THREE.Group();
solarSystemGroup.rotation.x = isMobile ? Math.PI / 8 : Math.PI / 16; 
scene.add(solarSystemGroup);

// --- 光照系统 ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); 
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffeedd, 4.0, 3000);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.bias = -0.001;
solarSystemGroup.add(sunLight);

// --- 生成发光纹理 ---
function createGlowStarTexture() {
    const size = 64;
    const ctxCanvas = document.createElement('canvas');
    ctxCanvas.width = size; ctxCanvas.height = size;
    const ctx = ctxCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.9)'); 
    gradient.addColorStop(0.4, 'rgba(200, 220, 255, 0.6)');  
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(ctxCanvas);
}
const glowTexture = createGlowStarTexture();

// --- 生成真实地表纹理 ---
function generatePlanetTexture(type) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');

    if (type === 'sun') {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#ffaa00'); grad.addColorStop(0.5, '#ff4400'); grad.addColorStop(1, '#ffaa00');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256);
        for(let i=0; i<300; i++) {
            ctx.fillStyle = Math.random()>0.5 ? 'rgba(255,255,200,0.3)' : 'rgba(150,20,0,0.3)';
            ctx.beginPath(); ctx.arc(Math.random()*512, Math.random()*256, Math.random()*15, 0, Math.PI*2); ctx.fill();
        }
    } else if (type === 'earth') {
        ctx.fillStyle = '#0a2e5c'; ctx.fillRect(0, 0, 512, 256); 
        ctx.fillStyle = '#2d6a36'; 
        for(let i=0; i<150; i++) {
            ctx.beginPath(); ctx.arc(Math.random()*512, 40+Math.random()*176, Math.random()*25+5, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = '#ffffff'; 
        ctx.fillRect(0, 0, 512, 25); ctx.fillRect(0, 231, 512, 25);
        for(let i=0; i<200; i++) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.arc(Math.random()*512, Math.random()*256, Math.random()*10, 0, Math.PI*2); ctx.fill();
        }
    } else if (type === 'mars') {
        ctx.fillStyle = '#b54b2b'; ctx.fillRect(0, 0, 512, 256);
        for(let i=0; i<300; i++) {
            ctx.fillStyle = 'rgba(80, 20, 10, 0.3)';
            ctx.beginPath(); ctx.arc(Math.random()*512, Math.random()*256, Math.random()*12, 0, Math.PI*2); ctx.fill();
        }
    } else if (type === 'jupiter') {
        for(let y=0; y<256; y+=5) {
            ctx.fillStyle = Math.random() > 0.5 ? '#b89679' : (Math.random() > 0.5 ? '#d6c6b4' : '#8c6b51');
            ctx.fillRect(0, y, 512, 5 + Math.random()*10);
        }
        ctx.fillStyle = '#9e4a30'; 
        ctx.beginPath(); ctx.ellipse(200, 150, 40, 15, 0, 0, Math.PI*2); ctx.fill();
    } else if (type === 'saturn') {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#a59682'); grad.addColorStop(0.1, '#d0c3a9'); grad.addColorStop(0.3, '#ebdcae');
        grad.addColorStop(0.5, '#cba575'); grad.addColorStop(0.7, '#e4cd9f'); grad.addColorStop(0.9, '#c7b28f');
        grad.addColorStop(1, '#9b8c78');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for(let y=0; y<256; y+=4) if(Math.random()>0.5) ctx.fillRect(0, y, 512, 1+Math.random()*2);
    } else if (type === 'saturnRing') {
        const grad = ctx.createLinearGradient(0, 0, 512, 0);
        grad.addColorStop(0.00, 'rgba(0,0,0,0)');            
        grad.addColorStop(0.05, 'rgba(160, 140, 120, 0.4)'); 
        grad.addColorStop(0.20, 'rgba(190, 170, 140, 0.7)'); 
        grad.addColorStop(0.21, 'rgba(0,0,0,0.1)');          
        grad.addColorStop(0.22, 'rgba(230, 200, 160, 0.9)'); 
        grad.addColorStop(0.40, 'rgba(245, 215, 175, 1.0)'); 
        grad.addColorStop(0.70, 'rgba(220, 195, 155, 0.95)'); 
        grad.addColorStop(0.71, 'rgba(0, 0, 0, 0.0)');       
        grad.addColorStop(0.76, 'rgba(0, 0, 0, 0.0)');       
        grad.addColorStop(0.77, 'rgba(200, 185, 160, 0.85)');
        grad.addColorStop(0.90, 'rgba(180, 165, 145, 0.7)'); 
        grad.addColorStop(0.92, 'rgba(0, 0, 0, 0.0)');       
        grad.addColorStop(0.94, 'rgba(170, 155, 135, 0.6)'); 
        grad.addColorStop(1.00, 'rgba(0,0,0,0)');            
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256);
    } else if (type === 'venus') {
        const grad = ctx.createLinearGradient(0,0,512,256);
        grad.addColorStop(0, '#e8cfa1'); grad.addColorStop(1, '#b59b72');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256);
    } else if (type === 'mercury' || type === 'moon') {
        ctx.fillStyle = '#7a7a7a'; ctx.fillRect(0, 0, 512, 256);
        for(let i=0; i<400; i++) {
            ctx.fillStyle = Math.random()>0.5 ? 'rgba(50,50,50,0.4)' : 'rgba(150,150,150,0.4)';
            ctx.beginPath(); ctx.arc(Math.random()*512, Math.random()*256, Math.random()*6, 0, Math.PI*2); ctx.fill();
        }
    } else if (type === 'uranus') {
        ctx.fillStyle = '#8bc8e6'; ctx.fillRect(0, 0, 512, 256); 
    } else if (type === 'neptune') {
        ctx.fillStyle = '#3a61c2'; ctx.fillRect(0, 0, 512, 256); 
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(0, 100, 512, 20); 
    }
    return new THREE.CanvasTexture(c);
}

// --- 多色星空背景 ---
const spectralColors = [
    new THREE.Color(0xffffff), new THREE.Color(0xa8c2ff), new THREE.Color(0x38bdf8), 
    new THREE.Color(0xa855f7), new THREE.Color(0xffb74d), new THREE.Color(0xff6b6b)
];
const starCountBg = isMobile ? 3500 : 6000; 
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCountBg * 3);
const starCol = new Float32Array(starCountBg * 3);

for(let i = 0; i < starCountBg * 3; i+=3) {
    const radius = Math.random() * 2000 + 800; 
    const theta = Math.random() * Math.PI * 2; 
    const phi = Math.acos(Math.random() * 2 - 1); 
    starPos[i]   = radius * Math.sin(phi) * Math.cos(theta); 
    starPos[i+1] = radius * Math.sin(phi) * Math.sin(theta); 
    starPos[i+2] = radius * Math.cos(phi);                   

    let color; const rand = Math.random();
    if(rand > 0.4) color = spectralColors[0]; else if(rand > 0.15) color = spectralColors[1]; else if(rand > 0.08) color = spectralColors[2]; else if(rand > 0.04) color = spectralColors[3]; else if(rand > 0.01) color = spectralColors[4]; else color = spectralColors[5]; 
    starCol[i] = color.r; starCol[i+1] = color.g; starCol[i+2] = color.b;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));

const starMat = new THREE.PointsMaterial({
    size: isMobile ? 12 : 16, map: glowTexture, transparent: true, opacity: 1.0, 
    vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false
});
const backgroundStarsMesh = new THREE.Points(starGeo, starMat);
scene.add(backgroundStarsMesh);

// --- 太阳系构建 ---
const labelsContainer = document.getElementById('labels-container');
const activeSystems = []; 
const scaleMulti = isMobile ? 0.85 : 1.1; 
const sphereGeo = new THREE.SphereGeometry(1, 48, 48); 

const planetsData = [
    { name: "太阳 Sun", size: 45, type: 'sun', dist: 0, speed: 0, moons: [] },
    { name: "水星 Mercury", size: 3.5, type: 'mercury', dist: 80, speed: 0.015, moons: [] },
    { name: "金星 Venus", size: 7.5, type: 'venus', dist: 115, speed: 0.012, moons: [] },
    { name: "地球 Earth", size: 8, type: 'earth', dist: 155, speed: 0.01, hasAtmo: true, atmoColor: 0x4b9fe3, moons: [{size: 1.8, dist: 16, speed: 0.05}] },
    { name: "火星 Mars", size: 5.5, type: 'mars', dist: 195, speed: 0.008, moons: [{size: 1, dist: 10, speed: 0.06}, {size: 0.8, dist: 14, speed: 0.04}] },
    { name: "木星 Jupiter", size: 22, type: 'jupiter', dist: 280, speed: 0.004, moons: [{size: 2, dist: 28, speed: 0.04}, {size: 1.5, dist: 35, speed: 0.03}, {size: 2.5, dist: 42, speed: 0.02}, {size: 1.8, dist: 50, speed: 0.015}] },
    { name: "土星 Saturn", size: 18, type: 'saturn', dist: 380, speed: 0.003, hasRing: true, ringIn: 24, ringOut: 48, moons: [{size: 2, dist: 54, speed: 0.02}, {size: 1.2, dist: 62, speed: 0.01}] },
    { name: "天王星 Uranus", size: 13, type: 'uranus', dist: 470, speed: 0.002, moons: [{size: 1.2, dist: 22, speed: 0.03}, {size: 1, dist: 28, speed: 0.02}] },
    { name: "海王星 Neptune", size: 13, type: 'neptune', dist: 550, speed: 0.001, moons: [{size: 1.5, dist: 20, speed: 0.02}] }
];

const moonMatShared = new THREE.MeshStandardMaterial({ map: generatePlanetTexture('moon'), roughness: 0.9, metalness: 0.0 });

planetsData.forEach(pData => {
    const actualSize = pData.size * scaleMulti;
    const actualDist = pData.dist * scaleMulti;

    const orbitGroup = new THREE.Group();
    solarSystemGroup.add(orbitGroup);

    // 轨道线
    if (pData.dist > 0) {
        const trackThickness = isMobile ? 0.8 : 0.4; 
        const trackOpacity = isMobile ? 0.15 : 0.08;  

        const orbitLineGeo = new THREE.RingGeometry(actualDist, actualDist + trackThickness, 128);
        const orbitLineMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, transparent: true, opacity: trackOpacity, side: THREE.DoubleSide 
        });
        const orbitLine = new THREE.Mesh(orbitLineGeo, orbitLineMat);
        orbitLine.rotation.x = Math.PI / 2;
        solarSystemGroup.add(orbitLine);
    }

    const planetSystemGroup = new THREE.Group();
    planetSystemGroup.position.x = actualDist;
    if(pData.dist > 0) planetSystemGroup.position.y = (Math.random() - 0.5) * 8; 
    orbitGroup.add(planetSystemGroup);

    // 星球本体
    let planetMat;
    if (pData.type === 'sun') {
        planetMat = new THREE.MeshBasicMaterial({ map: generatePlanetTexture('sun') });
        const sunGlowMat = new THREE.SpriteMaterial({ 
            map: glowTexture, color: 0xffaa00, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.8 
        });
        const sunGlow = new THREE.Sprite(sunGlowMat);
        sunGlow.scale.set(actualSize * 4, actualSize * 4, 1);
        planetSystemGroup.add(sunGlow);
    } else {
        planetMat = new THREE.MeshStandardMaterial({ 
            map: generatePlanetTexture(pData.type), roughness: 0.7, metalness: 0.0 
        });
    }

    const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
    planetMesh.scale.set(actualSize, actualSize, actualSize);
    
    if (pData.type !== 'sun') {
        planetMesh.castShadow = true;
        planetMesh.receiveShadow = true;
    }
    planetSystemGroup.add(planetMesh);

    if (pData.hasAtmo) {
        const atmoMat = new THREE.MeshPhongMaterial({
            color: pData.atmoColor, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending,
            side: THREE.FrontSide, shininess: 100
        });
        const atmoMesh = new THREE.Mesh(sphereGeo, atmoMat);
        atmoMesh.scale.set(actualSize * 1.05, actualSize * 1.05, actualSize * 1.05); 
        planetSystemGroup.add(atmoMesh);
    }

    if (pData.hasRing) {
        const ringGeo = new THREE.RingGeometry(pData.ringIn * scaleMulti, pData.ringOut * scaleMulti, 128);
        
        const pos = ringGeo.attributes.position;
        const uv = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const radius = Math.sqrt(x*x + y*y);
            const rNorm = (radius - pData.ringIn * scaleMulti) / ((pData.ringOut - pData.ringIn) * scaleMulti);
            uv.setXY(i, rNorm, 0.5); 
        }

        const ringMat = new THREE.MeshStandardMaterial({ 
            map: generatePlanetTexture('saturnRing'), 
            side: THREE.DoubleSide, 
            transparent: true, 
            opacity: 0.95, 
            roughness: 0.6,
            metalness: 0.1,
            emissive: 0x332211,
            emissiveIntensity: 0.3
        });
        
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2 - 0.1; 
        
        ringMesh.castShadow = true;
        ringMesh.receiveShadow = true;
        
        planetSystemGroup.add(ringMesh);
    }

    const moonObjects = [];
    pData.moons.forEach(m => {
        const moonOrbitGroup = new THREE.Group();
        moonOrbitGroup.rotation.x = (Math.random() - 0.5) * 0.5;
        moonOrbitGroup.rotation.y = Math.random() * Math.PI * 2;
        planetSystemGroup.add(moonOrbitGroup);

        const mMesh = new THREE.Mesh(sphereGeo, moonMatShared);
        const mSize = m.size * scaleMulti;
        mMesh.scale.set(mSize, mSize, mSize);
        mMesh.position.x = m.dist * scaleMulti;
        
        mMesh.castShadow = true;
        mMesh.receiveShadow = true;

        moonOrbitGroup.add(mMesh);
        moonObjects.push({ group: moonOrbitGroup, mesh: mMesh, speed: m.speed });
    });

    const hitBoxGeo = new THREE.SphereGeometry(actualSize * (isMobile ? 3.5 : 2.5), 8, 8); 
    const hitBoxMat = new THREE.MeshBasicMaterial({visible: false});
    const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    planetSystemGroup.add(hitBox);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = pData.name;
    labelsContainer.appendChild(labelDiv);

    orbitGroup.rotation.y = Math.random() * Math.PI * 2;

    activeSystems.push({
        orbitGroup: orbitGroup, planetSystemGroup: planetSystemGroup, planetMesh: planetMesh, 
        moonObjects: moonObjects, hitBox: hitBox, label: labelDiv,
        speed: pData.speed, actualSize: actualSize,
        targetOpacity: 0, currentOpacity: 0
    });
});

// --- 全景交互 ---
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotX = solarSystemGroup.rotation.x;
let targetRotY = solarSystemGroup.rotation.y; 

const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2(-999, -999);

function onPointerDown(e) {
    isDragging = true;
    canvas.style.cursor = 'grabbing';
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    previousMousePosition = { x: clientX, y: clientY };
}

function onPointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mouseVector.x = (clientX / window.innerWidth) * 2 - 1;
    mouseVector.y = -(clientY / window.innerHeight) * 2 + 1;

    if (isDragging) {
        const deltaX = clientX - previousMousePosition.x;
        const deltaY = clientY - previousMousePosition.y;
        targetRotY += deltaX * 0.005;
        targetRotX += deltaY * 0.005;
        targetRotX = Math.max(-Math.PI/3, Math.min(Math.PI/3, targetRotX)); 
        previousMousePosition = { x: clientX, y: clientY };
    }
}

function onPointerUp() { isDragging = false; canvas.style.cursor = 'grab'; }

window.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);
window.addEventListener('touchstart', onPointerDown, {passive: false});
window.addEventListener('touchmove', onPointerMove, {passive: false});
window.addEventListener('touchend', onPointerUp);

// --- 渲染循环 ---
function animate() {
    requestAnimationFrame(animate);

    solarSystemGroup.rotation.y += (targetRotY - solarSystemGroup.rotation.y) * 0.05;
    solarSystemGroup.rotation.x += (targetRotX - solarSystemGroup.rotation.x) * 0.05;

    backgroundStarsMesh.rotation.y += 0.0003;
    backgroundStarsMesh.rotation.x -= 0.0001;

    activeSystems.forEach(sys => {
        sys.orbitGroup.rotation.y -= sys.speed; 
        sys.planetMesh.rotation.y += 0.02;
        sys.moonObjects.forEach(m => {
            m.group.rotation.y -= m.speed;
            m.mesh.rotation.y += 0.05; 
        });
    });

    raycaster.setFromCamera(mouseVector, camera);
    const hitBoxes = activeSystems.map(s => s.hitBox);
    const intersects = raycaster.intersectObjects(hitBoxes);

    activeSystems.forEach(s => s.targetOpacity = 0.0);
    if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        const matchedSys = activeSystems.find(s => s.hitBox === hitObj);
        if (matchedSys) matchedSys.targetOpacity = 1.0; 
    }

    activeSystems.forEach(s => {
        s.currentOpacity += (s.targetOpacity - s.currentOpacity) * 0.15;

        if (s.currentOpacity > 0.05) {
            const vector = new THREE.Vector3();
            s.planetSystemGroup.getWorldPosition(vector);
            vector.project(camera);

            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

            if (vector.z < 1) {
                s.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y + s.actualSize + 25}px)`;
                s.label.style.opacity = s.currentOpacity; 
            } else {
                s.label.style.opacity = 0;
            }
        } else {
            s.label.style.opacity = 0;
        }
    });

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});