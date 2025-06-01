
NETWORK_PANEL_SHOWN = false

var network_phenotype = null
var $network_canva = null
var $nc_context = null
let network_viz_test_mode = false
var test_data = {
  specie: 'aba',
  nodes: {
    0: {id: 0, layer: 0},
    1: {id: 1, layer: 0},
    2: {id: 2, layer: 0},
    3: {id: 3, layer: 0},
    4: {id: 4, layer: 0},
    5: {id: 5, layer: 2},
    6: {id: 6, layer: 2},
    7: {id: 7, layer: 1},
    8: {id: 8, layer: 1},
  },
  connections: {
    0: {from: 0, to: 5, innov: 2, enabled: true, weight: 1.2},
    1: {from: 0, to: 6, innov: 2, enabled: false, weight: 0.9},
    2: {from: 3, to: 5, innov: 6, enabled: true, weight: 0.9},
    3: {from: 0, to: 3, innov: 1, enabled: true, weight: 1.1},
    4: {from: 3, to: 6, innov: 1, enabled: true, weight: 1.5},
    5: {from: 2, to: 6, innov: 3, enabled: false, weight: 0.2},
    6: {from: 4, to: 0, innov: 3, enabled: false, weight: 0.2},
  },
  layers: [
    [0, 1, 2],
    [5, 6],
    [3, 4],
  ],
}

const c = 7

function draw_node(ctx, node, color = 'grey') {
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
  // ctx.fillStyle = fillStyle
  // ctx.fillText('i:'+node.innov, node.x + c + 2, node.y + c + 2)

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

function draw_text_link(ctx, nodes, connection) {
  let xSup = false
  let ySup = false

  const middle = {}
  if (nodes[connection.from].x < nodes[connection.to].x) {
    middle.x = nodes[connection.from].x + (nodes[connection.to].x - nodes[connection.from].x) / 2
  } else {
    xSup = true
    middle.x = nodes[connection.to].x + (nodes[connection.from].x - nodes[connection.to].x) / 2
  }
  if (nodes[connection.from].y < nodes[connection.to].y) {
    middle.y = nodes[connection.from].y + (nodes[connection.to].y - nodes[connection.from].y) / 2
  } else {
    ySup = true
    middle.y = nodes[connection.to].y + (nodes[connection.from].y - nodes[connection.to].y) / 2
  }

  if ((!xSup && !ySup) || (xSup && ySup)) {
    ctx.fillText(connection.weight, middle.x, middle.y)
    ctx.fillText('i:'+connection.innov, middle.x - 10, middle.y + 10)
  } else {
    ctx.fillText(connection.weight, middle.x, middle.y + 10)
    ctx.fillText('i:'+connection.innov, middle.x - 10, middle.y)
  }
}

const resize_network_canva = (network = null) => {
  if (network) {
    network_phenotype = network
  } else if (network_phenotype === null) {
    network_phenotype = test_data
    network_viz_test_mode = true
  }

  if (!NETWORK_PANEL_SHOWN) {
    return
  }

  if ($network_canva === null) {
    $network_canva = $('#network-visualization')[0]
    $nc_context = $network_canva.getContext('2d')
  }

  if ($("#canvas")[0]) {
    $network_canva.width = $(window).width() - $("#canvas").width() - 20
    $network_canva.height = $("#canvas").height() - $network_canva.offsetTop - 20
  } else {
    $network_canva.width = $(window).width() - 20
    $network_canva.height = $(window).height() - $network_canva.offsetTop - 20    
  }

  // TODO: maybe replace this with an actual count of minimal size given maximum length of a layer
  if ($network_canva.height <= 100) {
    $network_canva.height = 100
  }

  const margin = $network_canva.width / 10 // 10% margin
  const xSpace = (() => {
    if (network_phenotype.layers.length > 2) {
      return $network_canva.width / (network_phenotype.layers.length - 1) - margin
    } else {
      return $network_canva.width - (margin * 2)
    }
  })()

  for (let i = 0; i < network_phenotype.layers.length; i++) {
    const ySpace = $network_canva.height / (network_phenotype.layers[i].length + 1)
    for (let j = 0; j < network_phenotype.layers[i].length; j++) {
      network_phenotype.nodes[network_phenotype.layers[i][j]].x = xSpace * i + margin
      network_phenotype.nodes[network_phenotype.layers[i][j]].y = ySpace * (j + 1)
    }
  }

  if (network_viz_test_mode) {
    const font = $nc_context.font
    const style = $nc_context.fillStyle
    const align = $nc_context.textAlign

    $nc_context.fillStyle = 'grey'
    $nc_context.textAlign = 'center'
    $nc_context.font = '50px arial'
    $nc_context.fillText('TEST MODE', $network_canva.width / 2, $network_canva.height / 2 + 25)

    $nc_context.font = font
    $nc_context.fillStyle = style
    $nc_context.textAlign = align
  }

  for (let k in network_phenotype.connections) {
    draw_link($nc_context, network_phenotype.nodes, network_phenotype.connections[k])
  }

  // draw node after so text overlap connections
  for (let i = 0; i < network_phenotype.layers.length; i++) {
    let ySpace = $network_canva.height / (network_phenotype.layers[i].length + 1)
    for (let j = 0; j < network_phenotype.layers[i].length; j++) {
      draw_node($nc_context, network_phenotype.nodes[network_phenotype.layers[i][j]])
    }
  }

  // write text link after everything so it is on top
  for (let k in network_phenotype.connections) {
    draw_text_link($nc_context, network_phenotype.nodes, network_phenotype.connections[k])
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

