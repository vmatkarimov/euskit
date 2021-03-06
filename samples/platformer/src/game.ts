/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />
/// <reference path="../../../base/tilemap.ts" />
/// <reference path="../../../base/planmap.ts" />
/// <reference path="../../../base/planrunner.ts" />

//  Platformer
//
//  An example of intermediate level using
//  basic physics and path finding.
//


//  Initialize the resources.
let SPRITES: SpriteSheet;
enum S {
    PLAYER = 0,
    SHADOW = 1,
    THINGY = 2,
    YAY = 3,
    MONSTER = 4,
};
let TILES: SpriteSheet;
enum T {
    BACKGROUND = 0,
    BLOCK = 1,
    LADDER = 2,
    THINGY = 3,
    ENEMY = 8,
    PLAYER = 9,
}
addInitHook(() => {
    //PlanningEntity.debug = true;
    SPRITES = new ImageSpriteSheet(
	IMAGES['sprites'], new Vec2(32,32), new Vec2(16,16));
    TILES = new ImageSpriteSheet(
	IMAGES['tiles'], new Vec2(48,48), new Vec2(0,16));
});
const JUMPFUNC = (vy:number, t:number) => {
    return (0 <= t && t <= 6)? -8 : vy+2;
};
const MAXSPEED = new Vec2(16, 16);


//  WorldObject
//
class WorldObject {
    
    scene: Game;
    
    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	return [this.scene.screen];
    }
    
}

function findShadowPos(tilemap: TileMap, pos: Vec2) {
    let rect = tilemap.coord2map(pos);
    let p = new Vec2(rect.x, rect.y);
    while (p.y < tilemap.height) {
	let c = tilemap.get(p.x, p.y+1);
	if (c == T.BLOCK || c == -1) break;
	p.y++;
    }
    let y = tilemap.map2coord(p).center().y;
    return new Vec2(pos.x, y);
}


//  ShadowSprite
//  An EntitySprite with shadow.
//
class ShadowSprite extends EntitySprite {

    shadow: HTMLImageSource = null;
    shadowPos: Vec2 = null;
    
    constructor(entity: Entity=null) {
	super(entity);
	this.shadow = SPRITES.get(S.SHADOW) as HTMLImageSource;
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	let imgsrc = this.shadow;
	let pos = this.shadowPos;
	if (this.entity !== null && imgsrc !== null && pos !== null) {
	    ctx.save();
	    ctx.translate(bx+int(pos.x), by+int(pos.y));
	    let srcRect = imgsrc.srcRect;
	    let dstRect = imgsrc.dstRect;
	    // Shadow gets smaller based on its ground distance.
	    let d = (pos.y - this.entity.pos.y)/4;
	    if (d*2 <= dstRect.width && d*2 <= dstRect.height) {
		ctx.drawImage(
		    imgsrc.image,
		    srcRect.x, srcRect.y, srcRect.width, srcRect.height,
		    dstRect.x+d, dstRect.y+d*2,
		    dstRect.width-d*2, dstRect.height-d*2);
	    }
	    ctx.restore();
	}
	super.render(ctx, bx, by);
    }
}


//  Player
//
class Player extends PlatformerEntity implements WorldObject {

    scene: Game;
    usermove: Vec2 = new Vec2();
    holding: boolean = false;
    picked: Signal;

    constructor(scene: Game, pos: Vec2) {
	super(scene.tilemap, pos);
	this.sprite = new ShadowSprite(this);
	this.sprite.imgsrc = SPRITES.get(S.PLAYER);
	this.collider = this.sprite.getBounds(new Vec2());
	this.scene = scene;
	this.jumpfunc = JUMPFUNC;
	this.maxspeed = MAXSPEED;
	this.picked = new Signal(this);
    }

    hasLadder() {
	return this.hasTile(this.tilemap.isGrabbable);
    }

    canFall() {
	return !(this.holding && this.hasLadder());
    }

    isLanded() {
	return (this.holding && this.hasLadder()) || super.isLanded();
    }
    
    getObstaclesFor(range: Rect, v: Vec2, context=null as string): Rect[] {
	if (!this.holding) {
	    return this.tilemap.getTileRects(this.tilemap.isObstacle, range);
	}
	return super.getObstaclesFor(range, v, context);
    }
    
    update() {
	super.update();
	let v = this.usermove;
	if (this.hasLadder()) {
	    if (v.y < 0) {
		// Grab the ladder.
		this.holding = true;
	    }
	}
	if (!this.holding) {
	    v = new Vec2(v.x, 0);
	} else if (!this.hasLadder()) {
	    v = new Vec2(v.x, lowerbound(0, v.y));
	}
	this.moveIfPossible(v);
	(this.sprite as ShadowSprite).shadowPos = findShadowPos(this.tilemap, this.pos);
    }
    
    setJump(jumpend: number) {
	if (0 < jumpend) {
	    // Release the ladder when jumping.
	    this.holding = false;
	}
	super.setJump(jumpend);
	if (0 < jumpend && this.isJumping()) {
	    playSound(SOUNDS['jump']);
	}
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(8);
    }

    collidedWith(entity: Entity) {
	super.collidedWith(entity);
	if (entity instanceof Thingy) {
	    playSound(SOUNDS['pick']);
	    entity.stop();
	    this.picked.fire(entity);
	}
    }
}
applyMixins(Player, [WorldObject]);


//  Monster
//
class Monster extends PlanningEntity implements WorldObject {

    scene: Game;
    target: Entity;

    constructor(scene: Game, pos: Vec2) {
	super(scene.profile, scene.tilemap, pos);
	this.scene = scene;
	this.sprite = new ShadowSprite(this);
	this.sprite.imgsrc = SPRITES.get(S.MONSTER);
	this.collider = this.sprite.getBounds(new Vec2());
	this.jumpfunc = JUMPFUNC;
	this.maxspeed = MAXSPEED;
	this.setHitbox(this.collider as Rect);
    }

    update() {
	super.update();
	if (!this.isPlanRunning()) {
	    let p = this.target.pos;
	    let runner = this.getPlan(p, 20, 40)
	    if (runner !== null) {
		this.startPlan(runner);
	    }
	}
	(this.sprite as ShadowSprite).shadowPos = findShadowPos(this.tilemap, this.pos);
	this.move();
    }
}
applyMixins(Monster, [WorldObject]);


//  Thingy
//
class Thingy extends Entity {
    
    constructor(pos: Vec2) {
	super(pos);
	this.sprite.imgsrc = SPRITES.get(S.THINGY);
	this.collider = this.sprite.getBounds(new Vec2()).inflate(-4, -4);
    }
}


//  Game
// 
class Game extends GameScene {

    tilemap: TileMap;
    player: Player;
    profile: GridProfile;
    thingies: number;
    
    init() {
	super.init();
	const MAP = [
	    "00000000000000300000",
	    "00002111210001121100",
	    "00112000200000020000",
	    "00000000200000111211",
	    "00300011111000000200",
	    "00100300002000000200",
	    "00000000002111121100",
	    "00000110002000020000",
	    "00000000002000020830",
	    "00110002111000111111",
	    "00000002000000002000",
	    "11030111112110002003",
	    "00010000002000112110",
	    "31020100092000002000",
	    "11111111111111111111",
	];
	this.tilemap = new TileMap(32, 20, 15, MAP.map(
	    (v:string) => { return str2array(v); }
	));
	this.tilemap.isObstacle = ((c:number) => { return c == T.BLOCK; });
	this.tilemap.isGrabbable = ((c:number) => { return c == T.LADDER; });
	this.tilemap.isStoppable = ((c:number) => { return c == T.BLOCK || c == T.LADDER; });
	this.profile = new GridProfile(this.tilemap);

	// Place the player.
	let p = this.tilemap.findTile((c:number) => { return c == T.PLAYER; });
	this.player = new Player(this, this.tilemap.map2coord(p).center());
	this.player.picked.subscribe((entity:Entity) => {
	    this.onPicked(entity);
	});
	this.add(this.player);

	// Place monsters and stuff.
	this.thingies = 0;
	this.tilemap.apply((x:number, y:number, c:number) => {
	    let rect = this.tilemap.map2coord(new Vec2(x,y));
	    switch (c) {
	    case T.THINGY:
		let thingy = new Thingy(rect.center());
		this.add(thingy);
		this.thingies++;
		break;
	    case T.ENEMY:
		let monster = new Monster(this, rect.center());
		monster.target = this.player;
		this.add(monster);
		break;
	    }
	    return false;
	});
    }

    update() {
	super.update();
	this.layer.setCenter(this.tilemap.bounds,
			     this.player.pos.expand(80,80));
    }

    onDirChanged(v: Vec2) {
	this.player.setMove(v);
    }
    onButtonPressed(keysym: KeySym) {
	this.player.setJump(Infinity);
    }
    onButtonReleased(keysym: KeySym) {
	this.player.setJump(0);
    }

    onPicked(entity: Entity) {
	let yay = new Projectile(entity.pos.move(0,-16));
	yay.sprite.imgsrc = SPRITES.get(S.YAY);
	yay.movement = new Vec2(0,-4);
	yay.lifetime = 0.5;
	this.add(yay);
	this.thingies--;
	if (this.thingies == 0) {
	    this.add(new DelayTask(2, () => { 
		APP.lockKeys();
		this.changeScene(new Ending());
	    }));
	}
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	// Render the background tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, bx, by, this.layer.window, 
	    (x,y,c) => { return (c != T.BLOCK)? TILES.get(T.BACKGROUND) : null; });
	// Render the map tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, bx, by, this.layer.window, 
	    (x,y,c) => { return (c == T.BLOCK || c == T.LADDER)? TILES.get(c) : null; });
	super.render(ctx, bx, by);
    }
}


//  Ending
// 
class Ending extends HTMLScene {
    
    constructor() {
	var html = '<strong>You Won!</strong><p>Yay!';
	super(html);
    }

    change() {
	this.changeScene(new Game());
    }
}
