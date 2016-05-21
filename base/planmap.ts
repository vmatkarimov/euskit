/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="tilemap.ts" />
/// <reference path="entity.ts" />


//  PlanActor
//
interface PlanActor {
    isMovable(v: Vec2): boolean;
    isLanded(): boolean;
    isHolding(): boolean;
    getGridPos(): Vec2;
    getGridBox(): Rect;
    getGridBoxAt(p: Vec2): Rect;
    getJumpPoints(): Vec2[];
    getFallPoints(): Vec2[];
    moveToward(p: Vec2): void;
    jumpToward(p: Vec2): void;
    
    canMoveTo(p: Vec2): boolean;
    canGrabAt(p: Vec2): boolean;
    canStandAt(p: Vec2): boolean;
    canClimbUp(p: Vec2): boolean;
    canClimbDown(p: Vec2): boolean;
    canFall(p0: Vec2, p1: Vec2): boolean;
    canJump(p0: Vec2, p1: Vec2): boolean;
}


//  PlanAction
//
enum ActionType {
    NONE=0,
    WALK,
    FALL,
    JUMP,
    CLIMB,
};

function getKey(x: number, y: number, context: string=null)
{
    return (context === null)? (x+','+y) : (x+','+y+':'+context);
}

class PlanAction {

    p: Vec2;
    next: PlanAction;
    cost: number;
    context: string;
    type: ActionType;

    constructor(p: Vec2,
		next: PlanAction=null,
		cost=0,
		context: string=null,
		type: ActionType=ActionType.NONE) {
	this.p = p;
	this.next = next;
	this.cost = cost;
	this.context = context;
	this.type = type;
    }

    getKey() {
	return getKey(this.p.x, this.p.y, this.context);
    }

    getColor() {
	switch (this.type) {
	case ActionType.WALK:
	    return 'white';
	case ActionType.FALL:
	    return 'blue';
	case ActionType.JUMP:
	    return 'magenta';
	case ActionType.CLIMB:
	    return 'cyan';
	default:
	    return null;
	}
    }
    
    toString() {
	return ('<PlanAction('+this.p.x+','+this.p.y+'): cost='+this.cost+' '+this.type+'>');
    }

}


//  PlanMap
//
interface PlanActionMap {
    [index: string]: PlanAction;
}
class PlanActionEntry {
    action: PlanAction;
    total: number;
    constructor(action: PlanAction, total: number) {
	this.action = action;
	this.total = total;
    }
}

class PlanProfile {
    
    tilemap: TileMap;
    gridsize: number;
    offset: number;

    constructor(tilemap:TileMap, resolution=1) {
	this.tilemap = tilemap;
	this.gridsize = tilemap.tilesize/resolution;
	this.offset = fmod(this.gridsize, tilemap.tilesize)/2;
    }

    coord2grid(p: Vec2) {
	return new Vec2(
	    int((p.x-this.offset)/this.gridsize),
	    int((p.y-this.offset)/this.gridsize));
    }

    grid2coord(p: Vec2) {
	return new Vec2(
	    int((p.x+.5)*this.gridsize)+this.offset,
	    int((p.y+.5)*this.gridsize)+this.offset);
    }
}

class PlanMap {

    profile: PlanProfile;
    actor: PlanActor;

    start: Vec2;
    goal: Vec2;
    
    private _map: PlanActionMap;
    private _queue: PlanActionEntry[];
    
    constructor(profile: PlanProfile, actor: PlanActor) {
	this.profile = profile;
	this.actor = actor;
	this.start = null;
	this.goal = null;
    }

    toString() {
	return ('<PlanMap '+this.goal+'>');
    }

    getAction(x: number, y: number, context: string=null) {
	let k = getKey(x, y, context);
	if (this._map.hasOwnProperty(k)) {
	    return this._map[k];
	} else {
	    return null;
	}
    }

    addAction(start: Vec2, action: PlanAction) {
	let key = action.getKey();
	let prev = this._map[key];
	if (prev === undefined || action.cost < prev.cost) {
	    this._map[key] = action;
	    let dist = ((start === null)? Infinity :
			(Math.abs(start.x-action.p.x)+
			 Math.abs(start.y-action.p.y)));
	    this._queue.push(new PlanActionEntry(action, dist+action.cost));
	}
    }

    render(ctx:CanvasRenderingContext2D, bx:number, by:number) {
	let profile = this.profile;
	let gs = profile.gridsize;
	let rs = gs/2;
	ctx.lineWidth = 1;
	for (let k in this._map) {
	    let action = this._map[k];
	    let color = action.getColor();
	    if (color !== null) {
		let p0 = profile.grid2coord(action.p);
		ctx.strokeStyle = color;
		ctx.strokeRect(bx+p0.x-rs/2+.5,
			       by+p0.y-rs/2+.5,
			       rs, rs);
		if (action.next !== null) {
		    let p1 = profile.grid2coord(action.next.p);
		    ctx.beginPath();
		    ctx.moveTo(bx+p0.x+.5, by+p0.y+.5);
		    ctx.lineTo(bx+p1.x+.5, by+p1.y+.5);
		    ctx.stroke();
		}
	    }
	}
	if (this.start !== null) {
	    let p = profile.grid2coord(this.start);
	    ctx.strokeStyle = '#ff0000';
	    ctx.strokeRect(bx+p.x-gs/2+.5,
			   by+p.y-gs/2+.5,
			   gs, gs);
	}
	if (this.goal !== null) {
	    let p = profile.grid2coord(this.goal);
	    ctx.strokeStyle = '#00ff00';
	    ctx.strokeRect(bx+p.x-gs/2+.5,
			   by+p.y-gs/2+.5,
			   gs, gs);
	}
    }

    initPlan(goal: Vec2) {
	this.goal = goal;
	this._map = {};
	this._queue = [];
	this.addAction(null, new PlanAction(goal));
    }

    fillPlan(range: Rect, start: Vec2=null, maxcost=20) {
	this.start = start;
	while (0 < this._queue.length) {
	    let a0 = this._queue.shift().action;
	    if (maxcost <= a0.cost) continue;
	    let p = a0.p;
	    if (start !== null && start.equals(p)) return true;
	    // assert(range.contains(p));

	    // try climbing down.
	    let dp = new Vec2(p.x, p.y-1);
	    if (range.contains(dp) &&
		this.actor.canClimbDown(dp)) {
		this.addAction(start, new PlanAction(
		    dp, a0, a0.cost+1, null, ActionType.CLIMB));
	    }
	    // try climbing up.
	    let up = new Vec2(p.x, p.y+1);
	    if (range.contains(up) &&
		this.actor.canClimbUp(up)) {
		this.addAction(start, new PlanAction(
		    up, a0, a0.cost+1, null, ActionType.CLIMB));
	    }

	    // for left and right.
	    for (let vx = -1; vx <= +1; vx += 2) {

		// try walking.
		let wp = new Vec2(p.x-vx, p.y);
		if (range.contains(wp) &&
		    this.actor.canMoveTo(wp) &&
		    (this.actor.canGrabAt(wp) ||
		     this.actor.canStandAt(wp))) {
		    this.addAction(start, new PlanAction(
			wp, a0, a0.cost+1, null, ActionType.WALK));
		}

		// try falling.
		if (this.actor.canStandAt(p)) {
		    let fallpts = this.actor.getFallPoints();
		    for (let i = 0; i < fallpts.length; i++) {
			let v = fallpts[i];
			// try the v.x == 0 case only once.
			if (v.x === 0 && vx < 0) continue;
			let fp = p.move(-v.x*vx, -v.y);
			if (!range.contains(fp)) continue;
			if (!this.actor.canMoveTo(fp)) continue;
			//  +--+....  [vx = +1]
			//  |  |....
			//  +-X+.... (fp.x,fp.y) original position.
			// ##.......
			//   ...+--+
			//   ...|  |
			//   ...+-X+ (p.x,p.y)
			//     ######
			if (this.actor.canFall(fp, p)) {
			    let dc = Math.abs(v.x)+Math.abs(v.y);
			    this.addAction(start, new PlanAction(
				fp, a0, a0.cost+dc, null, ActionType.FALL));
			}
		    }
		}

		// try jumping.
		if (a0.type === ActionType.FALL) {
		    let jumppts = this.actor.getJumpPoints();
		    for (let i = 0; i < jumppts.length; i++) {
			let v = jumppts[i];
			// try the v.x == 0 case only once.
			if (v.x === 0 && vx < 0) continue;
			let jp = p.move(-v.x*vx, -v.y);
			if (!range.contains(jp)) continue;
			if (!this.actor.canMoveTo(jp)) continue;
			if (!this.actor.canGrabAt(jp) && !this.actor.canStandAt(jp)) continue;
			//  ....+--+  [vx = +1]
			//  ....|  |
			//  ....+-X+ (p.x,p.y) tip point
			//  .......
			//  +--+...
			//  |  |...
			//  +-X+... (jp.x,jp.y) original position.
			// ######
			if (this.actor.canJump(jp, p)) {
			    let dc = Math.abs(v.x)+Math.abs(v.y);
			    this.addAction(start, new PlanAction(
				jp, a0, a0.cost+dc, null, ActionType.JUMP));
			}
		    }
		} else if (this.actor.canStandAt(p)) {
		    let jumppts = this.actor.getJumpPoints();
		    for (let i = 0; i < jumppts.length; i++) {
			let v = jumppts[i];
			if (v.x === 0) continue;
			let jp = p.move(-v.x*vx, -v.y);
			if (!range.contains(jp)) continue;
			if (!this.actor.canMoveTo(jp)) continue;
			if (!this.actor.canGrabAt(jp) && !this.actor.canStandAt(jp)) continue;
			//  ....+--+  [vx = +1]
			//  ....|  |
			//  ....+-X+ (p.x,p.y) tip point
			//  .....##
			//  +--+...
			//  |  |...
			//  +-X+... (jp.x,jp.y) original position.
			// ######
			if (this.actor.canJump(jp, p)) {
			    let dc = Math.abs(v.x)+Math.abs(v.y);
			    this.addAction(start, new PlanAction(
				jp, a0, a0.cost+dc, null, ActionType.JUMP));
			}
		    }
		}
	    }
	    
	    // A* search.
	    this._queue.sort(
		(a:PlanActionEntry,b:PlanActionEntry) => { return a.total-b.total; });
	}
	
	return false;
    }

}
