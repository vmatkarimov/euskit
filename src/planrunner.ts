/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="tilemap.ts" />
/// <reference path="entity.ts" />
/// <reference path="planmap.ts" />


//  PointSet
// 
interface PointMap {
    [index: string]: Vec2;
}
class PointSet {

    _pts: PointMap;

    constructor() {
	this._pts = {} as PointMap;
    }

    add(p: Vec2) {
	this._pts[p.x+','+p.y] = p;
    }

    exists(p: Vec2) {
	return (this._pts[p.x+','+p.y] !== undefined);
    }

    toList() {
	let a = [] as [Vec2];
	for (var k in this._pts) {
	    a.push(this._pts[k]);
	}
	return a;
    }
}


// calcJumpRange
function calcJumpRange(
    gridsize:number, speed:number,
    jumpfunc:JumpFunc, maxtime=15)
{
    let pts = new PointSet();
    for (let jt = 1; jt < maxtime; jt++) {
	let p = new Vec2();
	let vy = 0;
	for (let t = 0; t < maxtime; t++) {
	    vy = (t < jt)? jumpfunc(vy, t) : jumpfunc(vy, Infinity);
	    if (0 <= vy) {
		// tip point.
		let cy = Math.ceil(p.y/gridsize);
		for (let x = 0; x <= p.x; x++) {
		    let c = new Vec2(int(x/gridsize+.5), cy);
		    if (c.x == 0 && c.y == 0) continue;
		    pts.add(c);
		}
		break;
	    }
	    p.x += speed;
	    p.y += vy;
	}
    }
    return pts.toList();
}

// calcFallRange
function calcFallRange(
    gridsize:number, speed:number,
    jumpfunc:JumpFunc, maxtime=15)
{
    let p = new Vec2();
    let vy = 0;
    let pts = new PointSet();
    for (let t = 0; t < maxtime; t++) {
	vy = jumpfunc(vy, Infinity);
	p.x += speed;
	p.y += vy;
	let cy = Math.ceil(p.y/gridsize);
	for (let x = 0; x <= p.x; x++) {
	    let c = new Vec2(int(x/gridsize+.5), cy);
	    if (c.x == 0 && c.y == 0) continue;
	    pts.add(c);
	}
    }
    return pts.toList();
}


//  PlanActionRunner
//
class PathEntry {
    p: Vec2;
    d: number;
    next: PathEntry;
    constructor(p: Vec2, d: number, next:PathEntry) {
	this.p = p;
	this.d = d;
	this.next = next;
    }
}

class PlanActionRunner {

    plan: PlanMap;
    actor: PlanActor;
    action: PlanAction;
    timeout: number;
    count: number;
    
    constructor(plan: PlanMap, actor: PlanActor, timeout=Infinity) {
	this.plan = plan;
	this.actor = actor;
	this.timeout = timeout;
	let cur = actor.getGridPos();
	this.action = plan.getAction(cur.x, cur.y);
	
	this.count = this.timeout;
    }

    toString() {
	return ('<PlanActionRunner: actor='+this.actor+', action='+this.action+'>');
    }

    update() {
	if (this.action === null || this.action.next === null) return false;
	if (this.count <= 0) return false;
	this.count--;
	
	let plan = this.plan;
	let actor = this.actor;
	let tilemap = plan.tilemap;
	let cur = actor.getGridPos();
	let dst = this.action.next.p;

	// Get a micro-level (greedy) plan.
	switch (this.action.type) {
	case ActionType.NONE:
	    break;

	case ActionType.WALK:
	case ActionType.CLIMB:
	    actor.moveToward(dst);
	    if (cur.equals(dst)) {
		this.action = this.action.next;
		this.count = this.timeout;
	    }
	    break;
	    
	case ActionType.FALL:
	    let path = this.findSimplePath(cur, dst);
	    for (let i = 0; i < path.length; i++) {
		let r = actor.getGridBoxAt(path[i]);
		let v = r.diff(actor.getGridBox());
		if (actor.isMovable(v)) {
		    actor.moveToward(path[i]);
		    break;
		}
	    }
	    if (cur.equals(dst)) {
		this.action = this.action.next;
		this.count = this.timeout;
	    }
	    break;
	    
	case ActionType.JUMP:
	    if (actor.isLanded() && !actor.isHolding() &&
		actor.canJump(cur, dst)) {
		actor.jumpToward(dst);
		// once you leap, the action is considered finished.
		this.action = new PlanAction(dst, null, ActionType.WALK, this.action.next);
		this.count = this.timeout;
	    } else {
		// not landed, holding something, or has no clearance.
		actor.moveToward(cur);
	    }
	    break;
	}

	return true;
    }

    // findSimplePath(x0, y0, x1, x1, cb): 
    //   returns a list of points that a character can proceed without being blocked.
    //   returns null if no such path exists. This function takes O(w*h).
    //   Note: this returns only a straightforward path without any detour.
    findSimplePath(p0: Vec2, p1: Vec2) {
	let a = [] as [[PathEntry]];
	let w = Math.abs(p1.x-p0.x);
	let h = Math.abs(p1.y-p0.y);
	let INF = (w+h+1)*2;
	let vx = (p0.x <= p1.x)? +1 : -1;
	let vy = (p0.y <= p1.y)? +1 : -1;
	let actor = this.actor;
	
	for (let dy = 0; dy <= h; dy++) {
	    a.push([] as [PathEntry]);
	    // y: y0...y1
	    let y = p0.y+dy*vy;
	    for (let dx = 0; dx <= w; dx++) {
		// x: x0...x1
		let x = p0.x+dx*vx;
		// for each point, compare the cost of (x-1,y) and (x,y-1).
		let p = new Vec2(x, y);
		let d:number;
		let e:PathEntry = null;	// the closest neighbor (if exists).
		if (dx === 0 && dy === 0) {
		    d = 0;
		} else {
		    d = INF;
		    if (actor.canMoveTo(p)) {
			if (0 < dx && a[dy][dx-1].d < d) {
			    e = a[dy][dx-1];
			    d = e.d;
			}
			if (0 < dy && a[dy-1][dx].d < d) {
			    e = a[dy-1][dx];
			    d = e.d;
			}
		    }
		    d++;
		}
		// populate a[dy][dx].
		a[dy].push(new PathEntry(p, d, e));
	    }
	}
	// trace them in a reverse order: from goal to start.
	let r = [] as [Vec2];
	let e = a[h][w];
	while (e !== null) {
	    r.push(e.p);
	    e = e.next;
	}
	return r;
    }
}


//  PlanningEntity
//
class PlanningEntity extends PlatformerEntity implements PlanActor {

    jumppts: [Vec2];
    fallpts: [Vec2];
    timeout: number;
    speed: number;
    runner: PlanActionRunner;
    grid: PlanGrid;
    gridbox: Rect;
    obstacle: RangeMap;
    grabbable: RangeMap;
    stoppable: RangeMap;
    movement: Vec2;

    static debug: boolean;
    static gridsize: number;

    static initialize(gridsize:number, speed=4) {
	PlanningEntity.gridsize = gridsize;
    }
    
    constructor(tilemap: TileMap, bounds: Rect,
		src: ImageSource=null, hitbox: Rect=null,
		speed=4, timeout=30) {
	super(tilemap, bounds, src, hitbox);
	this.timeout = timeout;
	this.speed = speed;
	this.runner = null;
	this.movement = new Vec2();
	let gs = PlanningEntity.gridsize;
	this.gridbox = new Rect(0, 0,
				Math.ceil(hitbox.width/gs)*gs,
				Math.ceil(hitbox.height/gs)*gs);
	this.grid = new PlanGrid(gs);
	this.jumppts = calcJumpRange(gs, this.speed, PhysicalEntity.jumpfunc);
	this.fallpts = calcFallRange(gs, this.speed, PhysicalEntity.jumpfunc);
	//log("jumppts="+PlanningEntity.jumppts);
	//log("fallpts="+PlanningEntity.fallpts);
    }

    updateRangeMaps() {
	this.obstacle = this.tilemap.getRangeMap(
	    'obstacle', PlatformerEntity.isObstacle);
	this.grabbable = this.tilemap.getRangeMap(
	    'grabbable', PlatformerEntity.isGrabbable);
	this.stoppable = this.tilemap.getRangeMap(
	    'stoppable', PlatformerEntity.isStoppable);
    }

    isPlanRunning() {
	return (this.runner !== null);
    }

    startPlan(runner: PlanActionRunner) {
	this.runner = runner;
	//log("begin:"+this.runner);
    }
  
    stopPlan() {
	if (this.runner !== null) {
	    //log("end:  "+this.runner);
	    this.movement = new Vec2();
	}
	this.runner = null;
    }

    getPlan(p: Vec2, size=10, maxcost=20) {
	let goal = this.grid.coord2grid(p);
	let range = goal.expand(size, size);
	let start = this.getGridPos();
	this.updateRangeMaps();
	let plan = new PlanMap(this, this.grid, this.tilemap);
	plan.initPlan(goal);
	if (plan.fillPlan(range, start, maxcost)) {
	    return new PlanActionRunner(plan, this, this.timeout);
	}
	return null;
    }

    move() {
	// follow a plan.
	if (this.runner !== null) {
	    // end following a plan.
	    if (!this.runner.update()) {
		this.stopPlan();
	    }
	}
	this.moveIfPossible(this.movement, true);
    }

    render(ctx:CanvasRenderingContext2D, bx:number, by:number) {
	super.render(ctx, bx, by);
	if (PlanningEntity.debug && this.runner !== null) {
	    this.runner.plan.render(ctx, bx, by);
	}
    }
    
    // PlanActor methods
    
    getJumpPoints() {
	return this.jumppts;
    }
    getFallPoints() {
	return this.fallpts;
    }
    getGridPos() {
	return this.grid.coord2grid(this.hitbox.center());
    }
    getGridBox() {
	return this.hitbox.center().expand(this.gridbox.width, this.gridbox.height);
    }
    getGridBoxAt(p: Vec2) {
	return this.grid.grid2coord(p).expand(this.gridbox.width, this.gridbox.height);
    }
    canMoveTo(p: Vec2) {
	let hitbox = this.getGridBoxAt(p);
	return !this.obstacle.exists(this.tilemap.coord2map(hitbox));
    }
    canGrabAt(p: Vec2) {
	let hitbox = this.getGridBoxAt(p);
	return this.grabbable.exists(this.tilemap.coord2map(hitbox));
    }
    canStandAt(p: Vec2) {
	let hitbox = this.getGridBoxAt(p).move(0, this.grid.gridsize);
	return this.stoppable.exists(this.tilemap.coord2map(hitbox));
    }
    canClimbUp(p: Vec2) {
	let hitbox = this.getGridBoxAt(p);
	return this.grabbable.exists(this.tilemap.coord2map(hitbox));
    }
    canClimbDown(p: Vec2) {
	let hitbox = this.getGridBoxAt(p).move(0, this.hitbox.height);
	return this.grabbable.exists(this.tilemap.coord2map(hitbox));
    }
    canFall(p0: Vec2, p1: Vec2) {
	//  +--+.....
	//  |  |.....
	//  +-X+..... (p0.x,p0.y) original position.
	// ##   .....
	//      .+--+
	//      .|  |
	//      .+-X+ (p1.x,p1.y)
	//      ######
	let hb0 = this.getGridBoxAt(p0);
	let hb1 = this.getGridBoxAt(p1);
	let xc = (hb0.x < hb1.x)? hb0.right() : hb0.x;
	let x0 = Math.min(xc, hb1.x);
	let x1 = Math.max(xc, hb1.right());
	let y0 = Math.min(hb0.y, hb1.y);
	let y1 = Math.max(hb0.bottom(), hb1.bottom());
	let rect = new Rect(x0, y0, x1-x0, y1-y0);
	return !this.stoppable.exists(this.tilemap.coord2map(rect));
    }
    canJump(p0: Vec2, p1: Vec2) {
	//  .....+--+
	//  .....|  |
	//  .....+-X+ (p1.x,p1.y) tip point
	//  .....
	//  +--+.
	//  |  |.
	//  +-X+. (p0.x,p0.y) original position.
	// ######
	let hb0 = this.getGridBoxAt(p0);
	let hb1 = this.getGridBoxAt(p1);
	let xc = (hb0.x < hb1.x)? hb1.x : hb1.right();
	let x0 = Math.min(xc, hb0.x);
	let x1 = Math.max(xc, hb0.right());
	let y0 = Math.min(hb0.y, hb1.y);
	let y1 = Math.max(hb0.bottom(), hb1.bottom());
	let rect = new Rect(x0, y0, x1-x0, y1-y0);
	// XXX extra care is needed not to allow the following case:
	//      .#
	//    +--+
	//    |  |  (this is impossiburu!)
	//    +-X+
	//       #
	return !this.stoppable.exists(this.tilemap.coord2map(rect));
    }

    moveToward(p: Vec2) {
	let r = this.getGridBoxAt(p);
	let v = r.diff(this.hitbox);
	v.x = clamp(-this.speed, v.x, +this.speed);
	v.y = clamp(-this.speed, v.y, +this.speed);
	this.movement = v;
    }
    
    jumpToward(p: Vec2) {
	this.setJump(Infinity);
	this.moveToward(p);
    }
}
