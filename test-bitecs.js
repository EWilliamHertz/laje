import { createWorld, addEntity, addComponent } from 'bitecs'
const world = createWorld()
const Position = { x: new Float32Array(10) }
const eid = addEntity(world)
try {
  addComponent(world, Position, eid)
  console.log("SUCCESS 1")
} catch(e) {
  console.log("ERROR 1:", e.message)
}
try {
  addComponent(world, eid, Position)
  console.log("SUCCESS 2")
} catch(e) {
  console.log("ERROR 2:", e.message)
}
try {
  addComponent(world, Position(eid))
  console.log("SUCCESS 3")
} catch(e) {
  console.log("ERROR 3:", e.message)
}
