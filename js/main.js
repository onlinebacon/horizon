const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const space = 5;
const minHeight = 0.0254;

let earth_radius = 6371008.8;
let height = 100000 * 0.3048;
let scale = 300/6371008.8;
let yOffset = 0;

let hip;
let observer;
let d;
let dip;
let tangent;
let surface;

const units = [{
	name: 'mi',
	val: 1609.344,
}, {
	name: 'ft',
	val: 0.3048,
}, {
	name: 'in',
	val: 0.0254,
}];

const strDist = (val) => {
	let suffix = 'm';
	const last = units.length - 1;
	for (let i=0; i<units.length; ++i) {
		const unit = units[i];
		if (val >= unit.val || i === last) {
			val = val/unit.val;
			suffix = unit.name;
			break;
		}
	}
	if (val >= 1e3) {
		return Math.round(val).toString() + ' ' + suffix;
	}
	return Number(val.toPrecision(3)).toString() + ' ' + suffix;
};

const strAngle = (val) => {
	const arcMin = 1/60;
	if (val >= 1) {
		return Number(val.toFixed(1)).toString() + '°';
	}
	if (val >= arcMin) {
		return Number((val*60).toFixed(1)).toString() + "'";
	}
	return Number((val*3600).toFixed(1)).toString() + '"';
};

const transformPoint = ([ x, y ]) => {
	return [
		canvas.width/2 + x*scale,
		canvas.height/2 - (y - yOffset)*scale,
	];
};

const transformDist = (val) => {
	return val*scale;
};

const extend = (a, b, distance) => {
	const [ ax, ay ] = a;
	const [ bx, by ] = b;
	const dx = bx - ax;
	const dy = by - ay;
	const s = distance/Math.sqrt(dx*dx + dy*dy);
	const x = ax + dx*s;
	const y = ay + dy*s;
	return [ x, y ];
};

const drawRuler = (a, b, label) => {
	const [ ax, ay ] = a;
	const [ bx, by ] = b;
	const dx = bx - ax;
	const dy = by - ay;
	const d = Math.sqrt(dx*dx + dy*dy);
	const nx = dx/d;
	const ny = dy/d;
	const cx = (ax + bx)/2 + ny*(space + space);
	const cy = (ay + by)/2 - nx*(space + space);
	const angle = ny < 0 ? Math.PI*2 - Math.acos(nx) : Math.acos(nx);
	ctx.fillStyle = '#fff';
	ctx.strokeStyle = '#fff';
	ctx.beginPath();
	ctx.moveTo(ax + ny*space, ay - nx*space);
	ctx.lineTo(bx + ny*space, by - nx*space);
	ctx.stroke();
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(angle);
	ctx.textBaseline = 'bottom';
	ctx.textAlign = 'center';
	ctx.font = '14px arial';
	ctx.fillText(label, 0, 0);
	ctx.restore();
};

const calculate = () => {
	surface = [ 0, earth_radius ];
	hip = earth_radius + height;
	observer = [ 0, hip ];
	d = Math.sqrt(hip**2 - earth_radius**2);
	dip = Math.acos(earth_radius/hip);
	tangent = [ Math.sin(dip)*earth_radius, Math.cos(dip)*earth_radius ];
	const [ ox, oy ] = observer;
	const [ tx, ty ] = tangent;
	const dx = tx - ox;
	const dy = oy - ty;
	const s1 = canvas.height*0.8/dy;
	const s2 = canvas.width*0.4/dx;
	scale = Math.min(s1, s2);
	yOffset = (ty + oy)/2;
};

const clear = () => {
	ctx.fillStyle = '#222';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawEarth = () => {
	ctx.strokeStyle = '#777';
	ctx.beginPath();
	ctx.arc(...transformPoint([ 0, 0 ]), transformDist(earth_radius), 0, Math.PI*2);
	ctx.stroke();	
};

const drawPoint = ([ x, y ], color) => {
	ctx.fillStyle = color;
	[ x, y ] = transformPoint([ x, y ]);
	ctx.beginPath();
	ctx.arc(x, y, 2, 0, Math.PI*2);
	ctx.fill();
};

const drawObserver = () => {
	drawPoint(observer, '#fff');
};

const drawTangentPoint = () => {
	drawPoint(tangent);
};

const drawTangentLine = () => {
	ctx.strokeStyle = '#f70';
	ctx.beginPath();
	ctx.moveTo(...transformPoint(observer));
	ctx.lineTo(...transformPoint(extend(observer, tangent, d + earth_radius)));
	ctx.stroke();
};

const drawSemiTriangle = () => {
	ctx.strokeStyle = '#07f';
	ctx.beginPath();
	ctx.moveTo(...transformPoint(observer));
	ctx.lineTo(...transformPoint([ 0, 0 ]));
	ctx.lineTo(...transformPoint(tangent));
	ctx.stroke();
};

const drawHorizontal = () => {
	const [ tx ] = tangent;
	const [ , oy ] = observer;
	const x0 = - tx*0.1;
	const x1 = tx*1.1;
	const a = [ x0, oy ];
	const b = [ x1, oy ];
	ctx.strokeStyle = '#777';
	ctx.beginPath();
	ctx.moveTo(...transformPoint(a));
	ctx.lineTo(...transformPoint(b));
	ctx.stroke();
};

const drawDip = () => {
	const [ tx ] = tangent;
	const x = tx*0.25;
	const [ , y ] = observer;
	ctx.strokeStyle = '#fff';
	ctx.beginPath();
	ctx.arc(...transformPoint(observer), transformDist(x), 0, dip);
	ctx.stroke();
	ctx.fillStyle = '#fff';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'bottom';
	ctx.font = '14px arial';
	const [ vx, vy ] = transformPoint([ x, y ]);
	ctx.fillText(strAngle(dip/Math.PI*180), vx, vy - space);
};

const render = () => {
	clear();
	drawEarth();
	drawDip();
	drawHorizontal();
	drawSemiTriangle();
	drawTangentLine();
	drawPoint(observer, '#fff');
	drawPoint(tangent, '#fff');
	drawPoint(surface, '#fff');
	drawPoint([ 0, 0 ], '#fff');
	drawRuler(transformPoint(observer), transformPoint(tangent), strDist(d));
	drawRuler(transformPoint(surface), transformPoint(observer), strDist(height));
};

const resizeCanvas = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	calculate();
	render();
};

resizeCanvas();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('wheel', e => {
	const { deltaY } = e;
	if (deltaY > 0) {
		height = Math.exp(Math.log(height) + 0.025);
	}
	if (deltaY < 0) {
		height = Math.max(minHeight, Math.exp(Math.log(height) - 0.025));
	}
	calculate();
	render();
});
