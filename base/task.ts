/// <reference path="utils.ts" />


//  Task
//  A single procedure that runs at each frame.
//
class Task {

    running: boolean = true;
    tasklist: TaskList = null;
    lifetime: number = Infinity;
    started: number = 0;
    stopped: Signal;

    constructor() {
	this.stopped = new Signal(this);
    }

    toString() {
	return '<Task: time='+this.getTime()+'>';
    }

    getTime() {
	return (getTime() - this.started);
    }
  
    init() {
	this.started = getTime();
    }

    stop() {
	if (this.running) {
	    this.running = false;
	    this.stopped.fire();
	}
    }

    chain(task: Task): Task {
	if (this.running) {
	    this.stopped.subscribe(() => {
		if (this.tasklist !== null) {
		    this.tasklist.add(task)
		}
	    });
	} else {
	    if (this.tasklist !== null) {
		this.tasklist.add(task)
	    }
	}
	return task;
    }
  
    tick() {
	this.update();
	if (this.lifetime <= this.getTime()) {
	    this.stop();
	}
    }
  
    update() {
	// [OVERRIDE]
    }

}


//  DelayTask
//
class DelayTask extends Task {
    
    constructor(lifetime: number=Infinity, proc: ()=>void=null) {
	super();
	this.lifetime = lifetime;
	if (proc !== null) {
	    this.stopped.subscribe(proc);
	}
    }
}


//  SoundTask
//
class SoundTask extends Task {

    sound: HTMLAudioElement;
    startTime: number;
    
    constructor(sound: HTMLAudioElement=null, startTime: number=MP3_GAP) {
	super();
	this.sound = sound;
	this.startTime = startTime;
    }

    init() {
	super.init();
	playSound(this.sound, this.startTime);
    }

    update() {
	super.update();
	if (this.sound.ended) {
	    this.stop();
	}
    }

    stop() {
	this.sound.pause();
	super.stop();
    }
}


//  TaskList
// 
class TaskList {

    tasks: Task[] = [];

    toString() {
	return ('<TaskList: tasks='+this.tasks+'>');
    }
  
    init() {
	this.tasks = [];
    }
  
    tick() {
	for (let task of this.tasks) {
	    if (task.tasklist === null) {
		task.tasklist = this;
		task.init();
	    }
	    if (task.running) {
		task.tick();
	    }
	}
	this.tasks = this.tasks.filter((task: Task) => { return task.running; });
    }

    add(task: Task) {
	this.tasks.push(task);
    }
}
