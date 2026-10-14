// ============================================================================
// TECH QUEST: ESCAPE SIMULATOR — CANNON-ES RIGID BODY PHYSICS WORLD
// ============================================================================
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { escapeAudio } from './audioEngine.ts';

export interface PhysicsObjectBinding {
  mesh: THREE.Object3D;
  body: CANNON.Body;
  materialType: 'metal' | 'wood' | 'paper' | 'glass';
  isHeld: boolean;
  baseMass: number;
}

export class EscapePhysicsWorld {
  public world: CANNON.World;
  public bindings: PhysicsObjectBinding[] = [];
  private staticContactMaterial: CANNON.ContactMaterial;

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });

    this.world.broadphase = new CANNON.NaiveBroadphase();
    (this.world.solver as any).iterations = 10;

    const defaultMaterial = new CANNON.Material('default');
    this.staticContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.35,
        restitution: 0.25,
      }
    );
    this.world.addContactMaterial(this.staticContactMaterial);
    this.world.defaultContactMaterial = this.staticContactMaterial;
  }

  // 1. Create Static Room Bounds (Floor, Ceiling, 4 Walls)
  public buildRoomBoundaries(bounds: { minX: number; maxX: number; minZ: number; maxZ: number }, height: number = 4.2) {
    const halfWidth = (bounds.maxX - bounds.minX) / 2;
    const halfDepth = (bounds.maxZ - bounds.minZ) / 2;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    // Floor
    const floorBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      position: new CANNON.Vec3(centerX, 0, centerZ),
    });
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(floorBody);

    // Ceiling
    const ceilingBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      position: new CANNON.Vec3(centerX, height, centerZ),
    });
    ceilingBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    this.world.addBody(ceilingBody);

    // North Wall (minZ)
    const northWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(halfWidth + 0.5, height / 2, 0.2)),
      position: new CANNON.Vec3(centerX, height / 2, bounds.minZ - 0.2),
    });
    this.world.addBody(northWall);

    // South Wall (maxZ)
    const southWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(halfWidth + 0.5, height / 2, 0.2)),
      position: new CANNON.Vec3(centerX, height / 2, bounds.maxZ + 0.2),
    });
    this.world.addBody(southWall);

    // West Wall (minX)
    const westWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(0.2, height / 2, halfDepth + 0.5)),
      position: new CANNON.Vec3(bounds.minX - 0.2, height / 2, centerZ),
    });
    this.world.addBody(westWall);

    // East Wall (maxX)
    const eastWall = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(0.2, height / 2, halfDepth + 0.5)),
      position: new CANNON.Vec3(bounds.maxX + 0.2, height / 2, centerZ),
    });
    this.world.addBody(eastWall);
  }

  // 2. Add Static Furniture Obstacle
  public addStaticBox(
    position: THREE.Vector3 | [number, number, number],
    halfExtents: [number, number, number],
    rotationY: number = 0
  ): CANNON.Body {
    const pos = Array.isArray(position)
      ? new CANNON.Vec3(position[0], position[1], position[2])
      : new CANNON.Vec3(position.x, position.y, position.z);

    const body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(halfExtents[0], halfExtents[1], halfExtents[2])),
      position: pos,
    });

    if (rotationY !== 0) {
      body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationY);
    }

    this.world.addBody(body);
    return body;
  }

  // 3. Register Dynamic Pickable/Throwable Rigid Body
  public registerDynamicObject(
    mesh: THREE.Object3D,
    mass: number = 1.5,
    halfExtents: [number, number, number],
    materialType: 'metal' | 'wood' | 'paper' | 'glass' = 'wood'
  ): PhysicsObjectBinding {
    const shape = new CANNON.Box(new CANNON.Vec3(halfExtents[0], halfExtents[1], halfExtents[2]));
    const body = new CANNON.Body({
      mass,
      shape,
      position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
    });

    body.quaternion.set(
      mesh.quaternion.x,
      mesh.quaternion.y,
      mesh.quaternion.z,
      mesh.quaternion.w
    );

    body.linearDamping = 0.2;
    body.angularDamping = 0.3;

    // Collision Impact Audio
    let lastSoundTime = 0;
    body.addEventListener('collide', (event: any) => {
      const now = Date.now();
      if (now - lastSoundTime < 180) return;
      const contact = event.contact;
      if (!contact) return;
      const relVel = event.contact.getImpactVelocityAlongNormal();
      if (Math.abs(relVel) > 1.2) {
        lastSoundTime = now;
        const intensity = Math.min(Math.abs(relVel) / 6.0, 1.0);
        escapeAudio.playImpact(materialType, intensity);
      }
    });

    this.world.addBody(body);

    const binding: PhysicsObjectBinding = {
      mesh,
      body,
      materialType,
      isHeld: false,
      baseMass: mass,
    };
    this.bindings.push(binding);
    return binding;
  }

  // 4. Set Held State (Player is carrying object)
  public setHeld(binding: PhysicsObjectBinding, isHeld: boolean) {
    binding.isHeld = isHeld;
    if (isHeld) {
      binding.body.mass = 0;
      binding.body.type = CANNON.Body.KINEMATIC;
      binding.body.velocity.set(0, 0, 0);
      binding.body.angularVelocity.set(0, 0, 0);
      binding.body.updateMassProperties();
    } else {
      binding.body.mass = binding.baseMass;
      binding.body.type = CANNON.Body.DYNAMIC;
      binding.body.updateMassProperties();
      binding.body.wakeUp();
    }
  }

  // 5. Throw Held Body with Power Impulse
  public throwBody(
    binding: PhysicsObjectBinding,
    direction: THREE.Vector3,
    forceMagnitude: number
  ) {
    this.setHeld(binding, false);

    const speed = Math.max(forceMagnitude * 12.0, 4.0);
    binding.body.velocity.set(
      direction.x * speed,
      direction.y * speed + 1.2,
      direction.z * speed
    );

    // Random spin impulse
    binding.body.angularVelocity.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    );

    escapeAudio.playThrowWhoosh();
  }

  // 6. Drop Held Body Gently
  public dropBody(binding: PhysicsObjectBinding, forwardDir: THREE.Vector3) {
    this.setHeld(binding, false);
    binding.body.velocity.set(forwardDir.x * 1.0, -0.4, forwardDir.z * 1.0);
    binding.body.angularVelocity.set(0, 0, 0);
    escapeAudio.playDrop();
  }

  // 7. Step Physics Simulation & Sync to Three.js Meshes
  public step(deltaTime: number) {
    const fixedTimeStep = 1 / 60;
    const clampedDelta = Math.min(deltaTime, 0.05);
    this.world.step(fixedTimeStep, clampedDelta, 3);

    // Sync all dynamic bodies to their Three.js mesh transforms
    for (const binding of this.bindings) {
      if (!binding.isHeld) {
        binding.mesh.position.set(
          binding.body.position.x,
          binding.body.position.y,
          binding.body.position.z
        );
        binding.mesh.quaternion.set(
          binding.body.quaternion.x,
          binding.body.quaternion.y,
          binding.body.quaternion.z,
          binding.body.quaternion.w
        );
      }
    }
  }

  // 8. Clean Up All Bodies for Room Transitions
  public dispose() {
    for (const binding of this.bindings) {
      this.world.removeBody(binding.body);
    }
    this.bindings = [];
    const bodies = [...this.world.bodies];
    for (const body of bodies) {
      this.world.removeBody(body);
    }
  }
}
