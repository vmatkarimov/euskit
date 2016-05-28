/// <reference path="utils.ts" />


//  Vec2
//
class Vec2 {

    x: number;
    y: number;

    constructor(x=0, y=0) {
	this.x = x;
	this.y = y;
    }

    toString() {
	return '('+this.x+', '+this.y+')';
    }

    copy() {
	return new Vec2(this.x, this.y);
    }
    
    equals(p: Vec2) {
	return (this.x == p.x && this.y == p.y);
    }
    
    isZero() {
	return (this.x == 0 && this.y == 0);
    }
    
    len2() {
	return (this.x*this.x + this.y*this.y);
    }
    
    len() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    
    sign() {
	return new Vec2(sign(this.x), sign(this.y));
    }
    
    add(v: Vec2) {
	return new Vec2(this.x+v.x, this.y+v.y);
    }
    
    sub(v: Vec2) {
	return new Vec2(this.x-v.x, this.y-v.y);
    }
    
    scale(n: number) {
	return new Vec2(this.x*n, this.y*n);
    }
    
    distance(v: Vec2) {
	return this.sub(v).len();
    }
    
    clamp(bounds: Vec2) {
	return new Vec2(
	    clamp(-bounds.x, this.x, +bounds.x),
	    clamp(-bounds.y, this.y, +bounds.y));
    }
    
    move(dx: number, dy: number) {
	return new Vec2(this.x+dx, this.y+dy);
    }
    
    rot90(d: number) {
	if (d < 0) {
	    return new Vec2(this.y, -this.x);
	} else if (0 < d) {
	    return new Vec2(-this.y, this.x);
	} else {
	    return this.copy();
	}
    }
    
    expand(dw: number, dh: number, vx=0, vy=0) {
	return new Rect(this.x, this.y).expand(dw, dh, vx, vy);
    }
    
}


//  Vec3
//
class Vec3 {

    x: number;
    y: number;
    z: number;

    constructor(x=0, y=0, z=0) {
	this.x = x;
	this.y = y;
	this.z = z;
    }
    
    toString() {
	return '('+this.x+', '+this.y+', '+this.z+')';
    }
    
    copy() {
	return new Vec3(this.x, this.y, this.z);
    }
    
    equals(p: Vec3) {
	return (this.x == p.x && this.y == p.y && this.z == p.z);
    }
    
    isZero() {
	return (this.x == 0 && this.y == 0 && this.z == 0);
    }
    
    len2() {
	return (this.x*this.x + this.y*this.y + this.z*this.z);
    }
    
    len() {
	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    }
    
    sign() {
	return new Vec3(sign(this.x), sign(this.y), sign(this.z));
    }
    
    add(v: Vec3) {
	return new Vec3(this.x+v.x, this.y+v.y, this.z+v.z);
    }
    
    sub(v: Vec3) {
	return new Vec3(this.x-v.x, this.y-v.y, this.z-v.z);
    }
    
    scale(v: number) {
	return new Vec3(this.x*v, this.y*v, this.z*v);
    }
    
    distance(v: Vec3) {
	return this.sub(v).len();
    }
    
    clamp(bounds: Vec3) {
	return new Vec3(
	    clamp(-bounds.x, this.x, +bounds.x),
	    clamp(-bounds.y, this.y, +bounds.y),
	    clamp(-bounds.z, this.z, +bounds.z));
    }
    
    move(dx: number, dy: number, dz: number) {
	return new Vec3(this.x+dx, this.y+dy, this.z+dz);
    }

}


//  Rect
//
class Rect {

    x: number;
    y: number;
    width: number;
    height: number;
    
    constructor(x=0, y=0, width=0, height=0) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
    }
    
    toString() {
	return '('+this.x+', '+this.y+', '+this.width+', '+this.height+')';
    }
    
    copy() {
	return new Rect(this.x, this.y, this.width, this.height);
    }
    
    equals(rect: Rect) {
	return (this.x == rect.x && this.y == rect.y &&
		this.width == rect.width && this.height == rect.height);
    }
    
    isZero() {
	return (this.width == 0 && this.height == 0);
    }
    
    right() {
	return this.x+this.width;
    }
    bottom() {
	return this.y+this.height;
    }
    centerx() {
	return this.x+this.width/2;
    }
    centery() {
	return this.y+this.height/2;
    }
    center() {
	return new Vec2(this.x+this.width/2, this.y+this.height/2);
    }
    
    move(dx: number, dy: number) {
	return new Rect(this.x+dx, this.y+dy, this.width, this.height);  
    }
    
    add(v: Vec2) {
	return new Rect(this.x+v.x, this.y+v.y, this.width, this.height);  
    }
    
    inflate(dw: number, dh: number) {
	return new Rect(this.x-dw, this.y-dh, this.width+dw*2, this.height+dh*2);
    }
    
    anchor(vx=0, vy=0) {
	let x: number, y: number;
	if (0 < vx) {
	    x = this.x;
	} else if (vx < 0) {
	    x = this.x+this.width;
	} else {
	    x = this.x+this.width/2;
	}
	if (0 < vy) {
	    y = this.y;
	} else if (vy < 0) {
	    y = this.y+this.height;
	} else {
	    y = this.y+this.height/2;
	}
	return new Vec2(x, y);
    }
    
    expand(dw: number, dh: number, vx=0, vy=0) {
	let x: number, y: number;
	if (0 < vx) {
	    x = this.x;
	} else if (vx < 0) {
	    x = this.x-dw;
	} else {
	    x = this.x-dw/2;
	}
	if (0 < vy) {
	    y = this.y;
	} else if (vy < 0) {
	    y = this.y-dh;
	} else {
	    y = this.y-dh/2;
	}
	return new Rect(x, y, this.width+dw, this.height+dh);
    }
    
    resize(w: number, h: number, vx=0, vy=0) {
	let x: number, y: number;
	if (0 < vx) {
	    x = this.x;
	} else if (vx < 0) {
	    x = this.x+this.width-w;
	} else {
	    x = this.x+(this.width-w)/2;
	}
	if (0 < vy) {
	    y = this.y;
	} else if (vy < 0) {
	    y = this.y+this.height-h;
	} else {
	    y = this.y+(this.height-h)/2;
	}
	return new Rect(x, y, w, h);
    }
    
    containsPt(p: Vec2) {
	return (this.x <= p.x && this.y <= p.y &&
		p.x <= this.x+this.width && p.y <= this.y+this.height);
    }
    
    containsRect(rect: Rect) {
	return (this.x <= rect.x &&
		this.y <= rect.y &&
		rect.x+rect.width <= this.x+this.width &&
		rect.y+rect.height <= this.y+this.height);
    }
    
    xdistance(rect: Rect) {
	return Math.max(rect.x-(this.x+this.width),
			this.x-(rect.x+rect.width));
    }
    ydistance(rect: Rect) {
	return Math.max(rect.y-(this.y+this.height),
			this.y-(rect.y+rect.height));
    }
    
    overlaps(rect: Rect) {
	return (this.xdistance(rect) < 0 &&
		this.ydistance(rect) < 0);
    }
    
    union(rect: Rect) {
	let x0 = Math.min(this.x, rect.x);
	let y0 = Math.min(this.y, rect.y);
	let x1 = Math.max(this.x+this.width, rect.x+rect.width);
	let y1 = Math.max(this.y+this.height, rect.y+rect.height);
	return new Rect(x0, y0, x1-x0, y1-y0);
    }
    
    intersection(rect: Rect) {
	let x0 = Math.max(this.x, rect.x);
	let y0 = Math.max(this.y, rect.y);
	let x1 = Math.min(this.x+this.width, rect.x+rect.width);
	let y1 = Math.min(this.y+this.height, rect.y+rect.height);
	return new Rect(x0, y0, x1-x0, y1-y0);
    }
    
    clamp(bounds: Rect) {
	let x = ((bounds.width < this.width)? bounds.centerx() :
		 clamp(bounds.x, this.x, bounds.x+bounds.width-this.width));
	let y = ((bounds.height < this.height)? bounds.centery() :
		 clamp(bounds.y, this.y, bounds.y+bounds.height-this.height));
	return new Rect(x, y, this.width, this.height);
    }
    
    rndpt() {
	return new Vec2(this.x+frnd(this.width),
			this.y+frnd(this.height));
    }
    
    modpt(p: Vec2) {
	return new Vec2(this.x+fmod(p.x-this.x, this.width),
			this.y+fmod(p.y-this.y, this.height));
    }
    
    contactVLine(v: Vec2, x: number, y0: number, y1: number) {
	let dx: number, dy: number;
	let x0 = this.x;
	let x1 = this.x+this.width;
	if (x <= x0 && x0+v.x < x) {
	    dx = x-x0;
	} else if (x1 <= x && x < x1+v.x) {
	    dx = x-x1;
	} else {
	    return v;
	}
	dy = v.y*dx / v.x;
	let y = this.y+dy;
	if (y+this.height < y0 || y1 < y ||
	    (y+this.height == y0 && v.y <= 0) ||
	    (y1 == y && 0 <= v.y)) {
	    return v;
	}
	return new Vec2(dx, dy);
    }
    
    contactHLine(v: Vec2, y: number, x0: number, x1: number) {
	let dx: number, dy: number;
	let y0 = this.y;
	let y1 = this.y+this.height;
	if (y <= y0 && y0+v.y < y) {
	    dy = y-y0;
	} else if (y1 <= y && y < y1+v.y) {
	    dy = y-y1;
	} else {
	    return v;
	}
	dx = v.x*dy / v.y;
	let x = this.x+dx;
	if (x+this.width < x0 || x1 < x ||
	    (x+this.width == x0 && v.x <= 0) ||
	    (x1 == x && 0 <= v.x)) {
	    return v;
	}
	return new Vec2(dx, dy);
    }
    
    contactRect(v: Vec2, rect: Rect) {
	assert(!this.overlaps(rect), 'rect overlapped');
	
	if (0 < v.x) {
	    v = this.contactVLine(v, rect.x, rect.y, rect.y+rect.height);
	} else if (v.x < 0) {
	    v = this.contactVLine(v, rect.x+rect.width, rect.y, rect.y+rect.height);
	}

	if (0 < v.y) {
	    v = this.contactHLine(v, rect.y, rect.x, rect.x+rect.width);
	} else if (v.y < 0) {
	    v = this.contactHLine(v, rect.y+rect.height, rect.x, rect.x+rect.width);
	}

	return v;
    }

    contactBounds(v: Vec2, bounds: Rect) {
	if (0 < v.x) {
	    v = this.contactVLine(v, bounds.x+bounds.width, -Infinity, +Infinity);
	} else if (v.x < 0) {
	    v = this.contactVLine(v, bounds.x, -Infinity, +Infinity);
	}

	if (0 < v.y) {
	    v = this.contactHLine(v, bounds.y+bounds.height, -Infinity, +Infinity);
	} else if (v.y < 0) {
	    v = this.contactHLine(v, bounds.y, -Infinity, +Infinity);
	}

	return v;
    }

}


//  Circle
//
class Circle {

    center: Vec2;
    radius: number;

    constructor(center: Vec2, radius=0) {
	this.center = center;
	this.radius = radius;
    }

    toString() {
	return 'Circle(center='+this.center+', radius'+this.radius+')';
    }
    
    copy() {
	return new Circle(this.center.copy(), this.radius);
    }
    
    equals(circle: Circle) {
	return (this.center.equals(circle.center) &&
		this.radius == circle.radius);
    }
    
    isZero() {
	return this.radius == 0;
    }
    
    move(dx: number, dy: number) {
	return new Circle(this.center.move(dx, dy), this.radius);  
    }
    
    add(v: Vec2) {
	return new Circle(this.center.add(v), this.radius);
    }
    
    inflate(dr: number) {
	return new Circle(this.center, this.radius+dr);
    }
    
    resize(radius: number) {
	return new Circle(this.center, radius);
    }

    dist(p: Vec2) {
	return this.center.sub(p).len();
    }

    containsPt(p: Vec2) {
	return this.dist(p) <= this.radius;
    }

    containsCircle(circle: Circle) {
	let d = this.dist(circle.center);
	return d+circle.radius <= this.radius;
    }

    overlaps(circle: Circle) {
	let d = this.dist(circle.center);
	return d <= this.radius+circle.radius;
    }
    
    clamp(bounds: Rect) {
	let x = ((bounds.width < this.radius)? bounds.centerx() :
		 clamp(bounds.x, this.center.x, bounds.x+bounds.width-this.radius));
	let y = ((bounds.height < this.radius)? bounds.centery() :
		 clamp(bounds.y, this.center.y, bounds.y+bounds.height-this.radius));
	return new Circle(new Vec2(x, y), this.radius);
    }
    
    rndpt() {
	let r = frnd(this.radius);
	let t = frnd(Math.PI*2);
	return new Vec2(this.center.x+r*Math.cos(t),
			this.center.y+r*Math.sin(t));
    }
    
    contactCircle(v: Vec2, circle: Circle) {
	assert(!this.overlaps(circle), 'circle overlapped');
	let d = circle.center.sub(this.center);
	let dv = d.x*v.x + d.y*v.y;
	let v2 = v.len2();
	let d2 = d.len2();
	let R = (this.radius + circle.radius);
	// |d - t*v|^2 = (r1+r2)^2
	// t = { (d*v) + sqrt((d*v)^2 - v^2(d^2-R^2)) } / v^2
	let t = (dv - Math.sqrt(dv*dv - v2*(d2-R*R))) / v2;
	if (0 <= t && t <= 1) {
	    return v.scale(t);
	} else {
	    return v;
	}
    }
}


//  Box
//
class Box {

    origin: Vec3;
    size: Vec3;
    
    constructor(origin: Vec3, size: Vec3=null) {
	this.origin = origin;
	this.size = (size !== null)? size : new Vec3();
    }
    
    toString() {
	return '('+this.origin+', '+this.size+')';
    }
    
    copy() {
	return new Box(this.origin.copy(), this.size.copy());
    }
    
    equals(box: Box) {
	return (this.origin.equals(box.origin) &&
		this.size.equals(box.size));
    }
    
    isZero() {
	return this.size.isZero();
    }
    
    center() {
	return new Vec3(this.origin.x+this.size.x/2,
			this.origin.y+this.size.y/2,
			this.origin.z+this.size.z/2);
    }
    
    anchor(vx=0, vy=0, vz=0) {
	let x: number, y: number, z: number;
	if (0 < vx) {
	    x = this.origin.x;
	} else if (vx < 0) {
	    x = this.origin.x+this.size.x;
	} else {
	    x = this.origin.x+this.size.x/2;
	}
	if (0 < vy) {
	    y = this.origin.y;
	} else if (vy < 0) {
	    y = this.origin.y+this.size.y;
	} else {
	    y = this.origin.y+this.size.y/2;
	}
	if (0 < vz) {
	    z = this.origin.z;
	} else if (vz < 0) {
	    z = this.origin.z+this.size.z;
	} else {
	    z = this.origin.z+this.size.z/2;
	}
	return new Vec3(x, y, z);
    }
    
    move(dx: number, dy: number, dz: number) {
	return new Box(this.origin.move(dx, dy, dz), this.size);
    }
    
    add(v: Vec3) {
	return new Box(this.origin.add(v), this.size);
    }
    
    inflate(dx: number, dy: number, dz: number) {
	return new Box(this.origin.move(-dx, -dy, -dz),
		       this.size.move(dx*2, dy*2, dz*2));
    }
    
    xdistance(box: Box) {
	return Math.max(box.origin.x-(this.origin.x+this.size.x),
			this.origin.x-(box.origin.x+box.size.x));
    }
    
    ydistance(box: Box) {
	return Math.max(box.origin.y-(this.origin.y+this.size.y),
			this.origin.y-(box.origin.y+box.size.y));
    }
    
    zdistance(box: Box) {
	return Math.max(box.origin.z-(this.origin.z+this.size.z),
			this.origin.z-(box.origin.z+box.size.z));
    }
    
    containsPt(p: Vec3) {
	return (this.origin.x <= p.x && this.origin.y <= p.y && this.origin.z <= p.z &&
		p.x <= this.origin.x+this.size.x &&
		p.y <= this.origin.y+this.size.y &&
		p.z <= this.origin.z+this.size.z);
    }
    
    overlaps(box: Box) {
	return (this.xdistance(box) < 0 &&
		this.ydistance(box) < 0 &&
		this.zdistance(box) < 0);
    }
    
    union(box: Box) {
	let x0 = Math.min(this.origin.x, box.origin.x);
	let y0 = Math.min(this.origin.y, box.origin.y);
	let z0 = Math.min(this.origin.z, box.origin.z);
	let x1 = Math.max(this.origin.x+this.size.x, box.origin.x+box.size.x);
	let y1 = Math.max(this.origin.y+this.size.y, box.origin.y+box.size.y);
	let z1 = Math.max(this.origin.z+this.size.z, box.origin.z+box.size.z);
	return new Box(new Vec3(x0, y0, z0),
		       new Vec3(x1-x0, y1-y0, z1-z0));
    }
    
    intersection(box: Box) {
	let x0 = Math.max(this.origin.x, box.origin.x);
	let y0 = Math.max(this.origin.y, box.origin.y);
	let z0 = Math.max(this.origin.z, box.origin.z);
	let x1 = Math.min(this.origin.x+this.size.x, box.origin.x+box.size.x);
	let y1 = Math.min(this.origin.y+this.size.y, box.origin.y+box.size.y);
	let z1 = Math.min(this.origin.z+this.size.z, box.origin.z+box.size.z);
	return new Box(new Vec3(x0, y0, z0),
		       new Vec3(x1-x0, y1-y0, z1-z0));
    }
    
    clamp(bounds: Box) {
	let x = ((bounds.size.x < this.size.x)?
		 (bounds.origin.x+bounds.size.x/2) :
		 clamp(bounds.origin.x, this.origin.x,
		       bounds.origin.x+bounds.size.x-this.size.x));
	let y = ((bounds.size.y < this.size.y)?
		 (bounds.origin.y+bounds.size.y/2) :
		 clamp(bounds.origin.y, this.origin.y,
		       bounds.origin.y+bounds.size.y-this.size.y));
	let z = ((bounds.size.z < this.size.z)?
		 (bounds.origin.z+bounds.size.z/2) :
		 clamp(bounds.origin.z, this.origin.z,
		       bounds.origin.z+bounds.size.z-this.size.z));
	return new Box(new Vec3(x, y, z), this.size);
    }
    
    rndpt() {
	return new Vec3(this.origin.x+frnd(this.size.x),
			this.origin.y+frnd(this.size.y),
			this.origin.z+frnd(this.size.z));
    }

    contactYZPlane(v: Vec3, x: number, rect: Rect) {
	let dx: number, dy: number, dz: number;
	let x0 = this.origin.x;
	let x1 = this.origin.x+this.size.x;
	if (x <= x0 && x0+v.x < x) {
	    dx = x-x0;
	} else if (x1 <= x && x < x1+v.x) {
	    dx = x-x1;
	} else {
	    return v;
	}
	dy = v.y*dx / v.x;
	dz = v.z*dx / v.x;
	if (rect !== null) {
	    let y = this.origin.y+dy;
	    let z = this.origin.z+dz;
	    if (y+this.size.y < rect.x || rect.x+rect.width < y ||
		z+this.size.z < rect.y || rect.y+rect.height < z ||
		(y+this.size.y == rect.x && v.y <= 0) ||
		(rect.x+rect.width == y && 0 <= v.y) ||
		(z+this.size.z == rect.y && v.z <= 0) ||
		(rect.y+rect.height == z && 0 <= v.z)) {
		return v;
	    }
	}
	return new Vec3(dx, dy, dz);
    }
    
    contactZXPlane(v: Vec3, y: number, rect: Rect) {
	let dx: number, dy: number, dz: number;
	let y0 = this.origin.y;
	let y1 = this.origin.y+this.size.y;
	if (y <= y0 && y0+v.y < y) {
	    dy = y-y0;
	} else if (y1 <= y && y < y1+v.y) {
	    dy = y-y1;
	} else {
	    return v;
	}
	dz = v.z*dy / v.y;
	dx = v.x*dy / v.y;
	if (rect !== null) {
	    let z = this.origin.z+dz;
	    let x = this.origin.x+dx;
	    if (z+this.size.z < rect.x || rect.x+rect.width < z ||
		x+this.size.x < rect.y || rect.y+rect.height < x ||
		(z+this.size.z == rect.x && v.z <= 0) ||
		(rect.x+rect.width == z && 0 <= v.z) ||
		(x+this.size.x == rect.y && v.x <= 0) ||
		(rect.y+rect.height == x && 0 <= v.x)) {
		return v;
	    }
	}
	return new Vec3(dx, dy, dz);  
    }
    
    contactXYPlane(v: Vec3, z: number, rect: Rect) {
	let dx: number, dy: number, dz: number;
	let z0 = this.origin.z;
	let z1 = this.origin.z+this.size.z;
	if (z <= z0 && z0+v.z < z) {
	    dz = z-z0;
	} else if (z1 <= z && z < z1+v.z) {
	    dz = z-z1;
	} else {
	    return v;
	}
	dx = v.x*dz / v.z;
	dy = v.y*dz / v.z;
	if (rect !== null) {
	    let x = this.origin.x+dx;
	    let y = this.origin.y+dy;
	    if (x+this.size.x < rect.x || rect.x+rect.width < x ||
		y+this.size.y < rect.y || rect.y+rect.height < y ||
		(x+this.size.x == rect.x && v.x <= 0) ||
		(rect.x+rect.width == x && 0 <= v.x) ||
		(y+this.size.y == rect.y && v.y <= 0) ||
		(rect.y+rect.height == y && 0 <= v.y)) {
		return v;
	    }
	}
	return new Vec3(dx, dy, dz);  
    }
    
    contactBox(v: Vec3, box: Box) {
	assert(!this.overlaps(box), 'box overlapped');
	
	if (0 < v.x) {
	    v = this.contactYZPlane(v, box.origin.x, 
				    new Rect(box.origin.y, box.origin.z,
					     box.size.y, box.size.z));
	} else if (v.x < 0) {
	    v = this.contactYZPlane(v, box.origin.x+box.size.x, 
				    new Rect(box.origin.y, box.origin.z,
					     box.size.y, box.size.z));
	}

	if (0 < v.y) {
	    v = this.contactZXPlane(v, box.origin.y, 
				    new Rect(box.origin.z, box.origin.x,
					     box.size.z, box.size.x));
	} else if (v.y < 0) {
	    v = this.contactZXPlane(v, box.origin.y+box.size.y, 
				    new Rect(box.origin.z, box.origin.x,
					     box.size.z, box.size.x));
	}
	
	if (0 < v.z) {
	    v = this.contactXYPlane(v, box.origin.z, 
				    new Rect(box.origin.x, box.origin.y,
					     box.size.x, box.size.y));
	} else if (v.z < 0) {
	    v = this.contactXYPlane(v, box.origin.z+box.size.z, 
				    new Rect(box.origin.x, box.origin.y,
					     box.size.x, box.size.y));
	}
	
	return v;
    }

}
