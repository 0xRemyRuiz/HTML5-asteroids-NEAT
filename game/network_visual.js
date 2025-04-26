

var $network_canva = null
var $nc_context = null
var test_data = {
  specie: 'aba',
  nodes: {
    0: {id: 0, layer: 0, innov: 0},
    1: {id: 1, layer: 0, innov: 0},
    2: {id: 2, layer: 0, innov: 0},
    3: {id: 3, layer: 0, innov: 0},
    4: {id: 4, layer: 0, innov: 0},
    5: {id: 5, layer: 2, innov: 2},
    6: {id: 6, layer: 2, innov: 0},
    7: {id: 7, layer: 1, innov: 3},
    8: {id: 8, layer: 1, innov: 5},
  },
  connections: [
    {from: 0, to: 5, innov: 2, enabled: true, weight: 1.2},
    {from: 0, to: 6, innov: 2, enabled: false, weight: 0.9},
    {from: 3, to: 5, innov: 6, enabled: true, weight: 0.9},
    {from: 0, to: 3, innov: 1, enabled: true, weight: 1.1},
    {from: 3, to: 6, innov: 1, enabled: true, weight: 1.5},
    {from: 2, to: 6, innov: 3, enabled: false, weight: 0.2},
  ],
  layers: [
    [0, 1, 2],
    [5, 6],
    [3, 4],
  ],
}

// test values
var network = test_data

const c = 7

function draw_node(ctx, node, color = 'black') {
  const strokeStyle = ctx.strokeStyle
  const lineWidth = ctx.lineWidth
  const fillStyle = ctx.fillStyle

  ctx.beginPath()
  ctx.lineWidth = 2
  ctx.strokeStyle = color
  ctx.arc(node.x, node.y, c, 0, 2 * Math.PI)
  ctx.stroke()

  ctx.fillStyle = 'blue'
  ctx.fillText(node.id, node.x - (c + 6), node.y + c + 6)
  ctx.fillStyle = fillStyle
  ctx.fillText('i:'+node.innov, node.x + c + 2, node.y + c + 2)

  ctx.fillStyle = fillStyle
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = lineWidth
}

function draw_link(ctx, nodes, connection) {
  const strokeStyle = ctx.strokeStyle
  const lineWidth = ctx.lineWidth
  const fillStyle = ctx.fillStyle

  ctx.lineWidth = connection.weight + .2
  ctx.lineWidth = ctx.lineWidth < 2.5 ? ctx.lineWidth : 2.5
  ctx.strokeStyle = connection.enabled ? 'darkgrey' : 'darkred'

  ctx.beginPath()
  ctx.moveTo(nodes[connection.from].x, nodes[connection.from].y)
  ctx.lineTo(nodes[connection.to].x, nodes[connection.to].y)
  ctx.stroke()

  ctx.fillStyle = fillStyle
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = lineWidth
}

const show_network_canva = () => {
  if ($network_canva === null) {
    $network_canva = $('#network-visualization')[0]
    $nc_context = $network_canva.getContext('2d')
  }

  $network_canva.width = $(window).width() - $("#canvas").width() - 20
  $network_canva.height = 300

  const xSpace = $network_canva.width / (network.layers.length + 1)

  for (let i = 0; i < network.layers.length; i++) {
    let ySpace = $network_canva.height / (network.layers[i].length + 1)
    for (let j = 0; j < network.layers[i].length; j++) {
      network.nodes[network.layers[i][j]].x = xSpace * (i + 1)
      network.nodes[network.layers[i][j]].y = ySpace * (j + 1)
    }
  }

  for (let i = 0; i < network.connections.length; i++) {
    draw_link($nc_context, network.nodes, network.connections[i])
  }

  // draw node after so text overlap connections
  for (let i = 0; i < network.layers.length; i++) {
    let ySpace = $network_canva.height / (network.layers[i].length + 1)
    for (let j = 0; j < network.layers[i].length; j++) {
      draw_node($nc_context, network.nodes[network.layers[i][j]])
    }
  }
}


//
// Experimental perfect link between circles
// Too much hassle for the added value
//

// const network_canva = $('#network-visualization')[0];
// const ctx = network_canva.getContext("2d");

// const c1 = {x: 25, y: 85};
// const c2 = {x: 45, y: 15};
// const c3 = {x: 65, y: 45};

// function draw_circle(x, y, color = 'grey') {
//   ctx.beginPath();
//   ctx.strokeStyle = color;
//   ctx.arc(x, y, 10, 0, 2 * Math.PI);
//   ctx.stroke();
// }

// function link(c1, c2) {
//   const c = Math.round(Math.sqrt(Math.abs(c2.x - c1.x) ** 2 + Math.abs(c2.y - c1.y) ** 2))
//   let alpha, beta, a, b

//   ctx.beginPath();
//   if (c2.x < c1.x) {
//       if (c2.y > c1.y) {
//           a = c1.x - c2.x
//           b = c2.y - c1.y
//       } else {
//           a = c2.y - c1.y
//           b = c2.x - c1.x
//       }
//   } else {
//       if (c2.y < c1.y) {
//           a = c2.x - c1.x
//           b = c1.y - c2.y
//       } else {
//           a = c2.y - c1.y
//           b = c2.X - c1.x
//       }
//   }

//   alpha = Math.asin(a / c)
//   beta = Math.asin(b / c)

//   alert(c+' - '+alpha+' - '+beta)
// }

// draw_circle(c1.x, c1.y, 'blue')
// draw_circle(c2.x, c2.y, 'green')
// draw_circle(c3.x, c3.y, 'red')


// link(c1, c2)

