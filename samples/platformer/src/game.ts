// platformer.ts


PlanningEntity.debug = true;
function jumpfunc (vy:number, t:number) {
    return (0 <= t && t <= 5)? -8 : vy+2;
}



//  WorldObject
//
class WorldObject {
    
    scene: Game;
    
    getFencesFor(range: Rect, force: boolean): Rect[] {
	return [this.scene.screen];
    }
    
}


//  Player
//
class Player extends PlatformerEntity {

    scene: Game;
    usermove: Vec2;

    constructor(scene: Game, pos: Vec2) {
	let bounds = pos.expand(32, 32);
	super(scene.tilemap, bounds, scene.sprites.get(0), bounds);
	this.scene = scene;
	this.usermove = new Vec2();
	this.setJumpFunc(jumpfunc);
    }

    update() {
	super.update();
	this.moveIfPossible(this.usermove, true);
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(8);
    }
}
applyMixins(Player, [WorldObject]);


//  Monster
//
class Monster extends PlanningEntity {

    scene: Game;
    target: Entity;

    constructor(scene: Game, pos: Vec2) {
	let bounds = pos.expand(32, 32);
	super(scene.profile, scene.tilemap, bounds, scene.sprites.get(4), bounds);
	this.scene = scene;
	this.setJumpFunc(jumpfunc);
    }

    update() {
	super.update();
	if (!this.isPlanRunning()) {
	    let p = this.target.collider.getAABB().center();
	    let runner = this.getPlan(p, 20, 40)
	    if (runner !== null) {
		this.startPlan(runner);
	    }
	}
	this.move();
    }
}
applyMixins(Monster, [WorldObject]);


//  Game
// 
class Game extends GameScene {

    tilemap: TileMap;
    player: Player;
    profile: GridProfile;
    sprites: SpriteSheet;
    tiles: SpriteSheet;

    constructor(app: App) {
	super(app);
	this.sprites = new ImageSpriteSheet(APP.images['sprites'], new Vec2(32,32));
	this.tiles = new ImageSpriteSheet(APP.images['tiles'], new Vec2(48,48), new Vec2(0,16));
    }
    
    init() {
	super.init();
	const MAP = [
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",

	    "00000000000000000000",
	    "00001000000000000000",
	    "00000100002000000000",
	    "00000010002110000000",
	    "00110000112000110000",
	    
	    "00000001002001000100",
	    "00000011002001100001",
	    "00010000011201110000",
	    "00111000000201111000",
	    "11111111111111111111",
	];
	this.tilemap = new TileMap(32, MAP.map((v:string) => { return str2array(v); }));
	this.tilemap.isObstacle = ((c:number) => { return c == 1; });
	this.tilemap.isGrabbable = ((c:number) => { return c == 2; });
	this.tilemap.isStoppable = ((c:number) => { return c != 0; });
	this.profile = new GridProfile(this.tilemap);
	
	this.player = new Player(this, this.screen.center());
	this.addObject(this.player);

	let monster = new Monster(this, this.screen.center())
	monster.target = this.player;
	this.addObject(monster);
    }

    tick() {
	super.tick();
	this.player.setMove(this.app.keyDir);
	this.layer.setCenter(this.tilemap.bounds,
			     this.player.bounds.inflate(80,80));
    }

    setAction(action: boolean) {
	this.player.setJump(action? Infinity : 0);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	// Render the background tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, bx, by, this.layer.window, this.tiles,
	    (x,y,c) => { return (c == 0 || c == 2)? 0 : -1; });
	// Render the map tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, bx, by, this.layer.window, this.tiles,
	    (x,y,c) => { return (c == 0)? -1 : c; });
	super.render(ctx, bx, by);
    }
}