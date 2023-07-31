// Three.js - https://github.com/mrdoob/three.js/
// RoundedBoxGeometry - https://github.com/pailhead/three-rounded-box

let selectedCube = 2;

const animationEngine = ( () => {

  let uniqueID = 0;

  class AnimationEngine {

    constructor() {

      this.ids = [];
      this.animations = {};
      this.update = this.update.bind( this );
      this.raf = 0;
      this.time = 0;

    }

    update() {

      const now = performance.now();
      const delta = now - this.time;
      this.time = now;

      let i = this.ids.length;

      this.raf = i ? requestAnimationFrame( this.update ) : 0;

      while ( i-- )
        this.animations[ this.ids[ i ] ] && this.animations[ this.ids[ i ] ].update( delta );

    }

    add( animation ) {

      animation.id = uniqueID ++;

      this.ids.push( animation.id );
      this.animations[ animation.id ] = animation;

      if ( this.raf !== 0 ) return;

      this.time = performance.now();
      this.raf = requestAnimationFrame( this.update );

    }

    remove( animation ) {

      const index = this.ids.indexOf( animation.id );

      if ( index < 0 ) return;

      this.ids.splice( index, 1 );
      delete this.animations[ animation.id ];
      animation = null;

    }

  }

  return new AnimationEngine();

} )();

class Animation {

  constructor( start ) {

    if ( start === true ) this.start();

  }

  start() {

    animationEngine.add( this );

  }

  stop() {

    animationEngine.remove( this );

  }

  update( delta ) {}

}

class World extends Animation {

  constructor( game ) {

    super( true );

    this.game = game;

    this.container = this.game.dom.game;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.container.appendChild( this.renderer.domElement );

    this.camera = new THREE.PerspectiveCamera( 2, 1, 0.1, 10000 );

    this.stage = { width: 2, height: 3 };
    this.fov = 10;

    this.createLights();

    this.onResize = [];

    this.resize();
    window.addEventListener( 'resize', () => this.resize(), false );

  }

  update() {

    this.renderer.render( this.scene, this.camera );

  }

  resize() {

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setSize( this.width, this.height );

    this.camera.fov = this.fov;
    this.camera.aspect = this.width / this.height;

    const aspect = this.stage.width / this.stage.height;
    const fovRad = this.fov * THREE.Math.DEG2RAD;

    let distance = ( aspect < this.camera.aspect )
      ? ( this.stage.height / 2 ) / Math.tan( fovRad / 2 )
      : ( this.stage.width / this.camera.aspect ) / ( 2 * Math.tan( fovRad / 2 ) );

    distance *= 0.4;

    this.camera.position.set( distance, distance, distance);
    this.camera.lookAt( this.scene.position );
    this.camera.updateProjectionMatrix();

    // const docFontSize = ( aspect < this.camera.aspect )
    //   ? ( this.height / 100 ) * aspect
    //   : this.width / 100;

    // document.documentElement.style.fontSize = docFontSize + 'px';

    if ( this.onResize ) this.onResize.forEach( cb => cb() );

  }

  createLights() {

    this.lights = {
      holder:  new THREE.Object3D,
      ambient: new THREE.AmbientLight( 0xffffff, 0.69 ),
      front:   new THREE.DirectionalLight( 0xffffff, 0.36 ),
      back:    new THREE.DirectionalLight( 0xffffff, 0.19 ),
    };

    this.lights.front.position.set( 1.5, 5, 3 );
    this.lights.back.position.set( -1.5, -5, -3 );

    this.lights.holder.add( this.lights.ambient );
    this.lights.holder.add( this.lights.front );
    this.lights.holder.add( this.lights.back );

    this.scene.add( this.lights.holder );

  }

}

function RoundedBoxGeometry( size, radius, radiusSegments ) {

  THREE.BufferGeometry.call( this );

  this.type = 'RoundedBoxGeometry';

  radiusSegments = ! isNaN( radiusSegments ) ? Math.max( 1, Math.floor( radiusSegments ) ) : 1;

  var width, height, depth;

  width = height = depth = size;
  radius = size * radius;

  radius = Math.min( radius, Math.min( width, Math.min( height, Math.min( depth ) ) ) / 2 );

  var edgeHalfWidth = width / 2 - radius;
  var edgeHalfHeight = height / 2 - radius;
  var edgeHalfDepth = depth / 2 - radius;

  this.parameters = {
    width: width,
    height: height,
    depth: depth,
    radius: radius,
    radiusSegments: radiusSegments
  };

  var rs1 = radiusSegments + 1;
  var totalVertexCount = ( rs1 * radiusSegments + 1 ) << 3;

  var positions = new THREE.BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );
  var normals = new THREE.BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );

  var
    cornerVerts = [],
    cornerNormals = [],
    normal = new THREE.Vector3(),
    vertex = new THREE.Vector3(),
    vertexPool = [],
    normalPool = [],
    indices = []
  ;

  var
    lastVertex = rs1 * radiusSegments,
    cornerVertNumber = rs1 * radiusSegments + 1
  ;

  doVertices();
  doFaces();
  doCorners();
  doHeightEdges();
  doWidthEdges();
  doDepthEdges();

  function doVertices() {

    var cornerLayout = [
      new THREE.Vector3( 1, 1, 1 ),
      new THREE.Vector3( 1, 1, - 1 ),
      new THREE.Vector3( - 1, 1, - 1 ),
      new THREE.Vector3( - 1, 1, 1 ),
      new THREE.Vector3( 1, - 1, 1 ),
      new THREE.Vector3( 1, - 1, - 1 ),
      new THREE.Vector3( - 1, - 1, - 1 ),
      new THREE.Vector3( - 1, - 1, 1 )
    ];

    for ( var j = 0; j < 8; j ++ ) {

      cornerVerts.push( [] );
      cornerNormals.push( [] );

    }

    var PIhalf = Math.PI / 2;
    var cornerOffset = new THREE.Vector3( edgeHalfWidth, edgeHalfHeight, edgeHalfDepth );

    for ( var y = 0; y <= radiusSegments; y ++ ) {

      var v = y / radiusSegments;
      var va = v * PIhalf;
      var cosVa = Math.cos( va );
      var sinVa = Math.sin( va );

      if ( y == radiusSegments ) {

        vertex.set( 0, 1, 0 );
        var vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
        cornerVerts[ 0 ].push( vert );
        vertexPool.push( vert );
        var norm = vertex.clone();
        cornerNormals[ 0 ].push( norm );
        normalPool.push( norm );
        continue;

      }

      for ( var x = 0; x <= radiusSegments; x ++ ) {

        var u = x / radiusSegments;
        var ha = u * PIhalf;
        vertex.x = cosVa * Math.cos( ha );
        vertex.y = sinVa;
        vertex.z = cosVa * Math.sin( ha );

        var vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
        cornerVerts[ 0 ].push( vert );
        vertexPool.push( vert );

        var norm = vertex.clone().normalize();
        cornerNormals[ 0 ].push( norm );
        normalPool.push( norm );

      }

    }

    for ( var i = 1; i < 8; i ++ ) {

      for ( var j = 0; j < cornerVerts[ 0 ].length; j ++ ) {

        var vert = cornerVerts[ 0 ][ j ].clone().multiply( cornerLayout[ i ] );
        cornerVerts[ i ].push( vert );
        vertexPool.push( vert );

        var norm = cornerNormals[ 0 ][ j ].clone().multiply( cornerLayout[ i ] );
        cornerNormals[ i ].push( norm );
        normalPool.push( norm );

      }

    }

  }

  function doCorners() {

    var flips = [
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true
    ];

    var lastRowOffset = rs1 * ( radiusSegments - 1 );

    for ( var i = 0; i < 8; i ++ ) {

      var cornerOffset = cornerVertNumber * i;

      for ( var v = 0; v < radiusSegments - 1; v ++ ) {

        var r1 = v * rs1;
        var r2 = ( v + 1 ) * rs1;

        for ( var u = 0; u < radiusSegments; u ++ ) {

          var u1 = u + 1;
          var a = cornerOffset + r1 + u;
          var b = cornerOffset + r1 + u1;
          var c = cornerOffset + r2 + u;
          var d = cornerOffset + r2 + u1;

          if ( ! flips[ i ] ) {

            indices.push( a );
            indices.push( b );
            indices.push( c );

            indices.push( b );
            indices.push( d );
            indices.push( c );

          } else {

            indices.push( a );
            indices.push( c );
            indices.push( b );

            indices.push( b );
            indices.push( c );
            indices.push( d );

          }

        }

      }

      for ( var u = 0; u < radiusSegments; u ++ ) {

        var a = cornerOffset + lastRowOffset + u;
        var b = cornerOffset + lastRowOffset + u + 1;
        var c = cornerOffset + lastVertex;

        if ( ! flips[ i ] ) {

          indices.push( a );
          indices.push( b );
          indices.push( c );

        } else {

          indices.push( a );
          indices.push( c );
          indices.push( b );

        }

      }

    }

  }

  function doFaces() {

    var a = lastVertex;
    var b = lastVertex + cornerVertNumber;
    var c = lastVertex + cornerVertNumber * 2;
    var d = lastVertex + cornerVertNumber * 3;

    indices.push( a );
    indices.push( b );
    indices.push( c );
    indices.push( a );
    indices.push( c );
    indices.push( d );

    a = lastVertex + cornerVertNumber * 4;
    b = lastVertex + cornerVertNumber * 5;
    c = lastVertex + cornerVertNumber * 6;
    d = lastVertex + cornerVertNumber * 7;

    indices.push( a );
    indices.push( c );
    indices.push( b );
    indices.push( a );
    indices.push( d );
    indices.push( c );

    a = 0;
    b = cornerVertNumber;
    c = cornerVertNumber * 4;
    d = cornerVertNumber * 5;

    indices.push( a );
    indices.push( c );
    indices.push( b );
    indices.push( b );
    indices.push( c );
    indices.push( d );

    a = cornerVertNumber * 2;
    b = cornerVertNumber * 3;
    c = cornerVertNumber * 6;
    d = cornerVertNumber * 7;

    indices.push( a );
    indices.push( c );
    indices.push( b );
    indices.push( b );
    indices.push( c );
    indices.push( d );

    a = radiusSegments;
    b = radiusSegments + cornerVertNumber * 3;
    c = radiusSegments + cornerVertNumber * 4;
    d = radiusSegments + cornerVertNumber * 7;

    indices.push( a );
    indices.push( b );
    indices.push( c );
    indices.push( b );
    indices.push( d );
    indices.push( c );

    a = radiusSegments + cornerVertNumber;
    b = radiusSegments + cornerVertNumber * 2;
    c = radiusSegments + cornerVertNumber * 5;
    d = radiusSegments + cornerVertNumber * 6;

    indices.push( a );
    indices.push( c );
    indices.push( b );
    indices.push( b );
    indices.push( c );
    indices.push( d );

  }

  function doHeightEdges() {

    for ( var i = 0; i < 4; i ++ ) {

      var cOffset = i * cornerVertNumber;
      var cRowOffset = 4 * cornerVertNumber + cOffset;
      var needsFlip = i & 1 === 1;

      for ( var u = 0; u < radiusSegments; u ++ ) {

        var u1 = u + 1;
        var a = cOffset + u;
        var b = cOffset + u1;
        var c = cRowOffset + u;
        var d = cRowOffset + u1;

        if ( ! needsFlip ) {

          indices.push( a );
          indices.push( b );
          indices.push( c );
          indices.push( b );
          indices.push( d );
          indices.push( c );

        } else {

          indices.push( a );
          indices.push( c );
          indices.push( b );
          indices.push( b );
          indices.push( c );
          indices.push( d );

        }

      }

    }

  }

  function doDepthEdges() {

    var cStarts = [ 0, 2, 4, 6 ];
    var cEnds = [ 1, 3, 5, 7 ];

    for ( var i = 0; i < 4; i ++ ) {

      var cStart = cornerVertNumber * cStarts[ i ];
      var cEnd = cornerVertNumber * cEnds[ i ];

      var needsFlip = 1 >= i;

      for ( var u = 0; u < radiusSegments; u ++ ) {

        var urs1 = u * rs1;
        var u1rs1 = ( u + 1 ) * rs1;

        var a = cStart + urs1;
        var b = cStart + u1rs1;
        var c = cEnd + urs1;
        var d = cEnd + u1rs1;

        if ( needsFlip ) {

          indices.push( a );
          indices.push( c );
          indices.push( b );
          indices.push( b );
          indices.push( c );
          indices.push( d );

        } else {

          indices.push( a );
          indices.push( b );
          indices.push( c );
          indices.push( b );
          indices.push( d );
          indices.push( c );

        }

      }

    }

  }

  function doWidthEdges() {

    var end = radiusSegments - 1;

    var cStarts = [ 0, 1, 4, 5 ];
    var cEnds = [ 3, 2, 7, 6 ];
    var needsFlip = [ 0, 1, 1, 0 ];

    for ( var i = 0; i < 4; i ++ ) {

      var cStart = cStarts[ i ] * cornerVertNumber;
      var cEnd = cEnds[ i ] * cornerVertNumber;

      for ( var u = 0; u <= end; u ++ ) {

        var a = cStart + radiusSegments + u * rs1;
        var b = cStart + ( u != end ? radiusSegments + ( u + 1 ) * rs1 : cornerVertNumber - 1 );

        var c = cEnd + radiusSegments + u * rs1;
        var d = cEnd + ( u != end ? radiusSegments + ( u + 1 ) * rs1 : cornerVertNumber - 1 );

        if ( ! needsFlip[ i ] ) {

          indices.push( a );
          indices.push( b );
          indices.push( c );
          indices.push( b );
          indices.push( d );
          indices.push( c );

        } else {

          indices.push( a );
          indices.push( c );
          indices.push( b );
          indices.push( b );
          indices.push( c );
          indices.push( d );

        }

      }

    }

  }

  var index = 0;

  for ( var i = 0; i < vertexPool.length; i ++ ) {

    positions.setXYZ(
      index,
      vertexPool[ i ].x,
      vertexPool[ i ].y,
      vertexPool[ i ].z
    );

    normals.setXYZ(
      index,
      normalPool[ i ].x,
      normalPool[ i ].y,
      normalPool[ i ].z
    );

    index ++;

  }

  this.setIndex( new THREE.BufferAttribute( new Uint16Array( indices ), 1 ) );
  this.addAttribute( 'position', positions );
  this.addAttribute( 'normal', normals );

}

RoundedBoxGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
RoundedBoxGeometry.constructor = RoundedBoxGeometry;

function RoundedPlaneGeometry( size, radius, depth ) {

  var x, y, width, height;

  x = y = - size / 2;
  width = height = size;
  radius = size * radius;

  const shape = new THREE.Shape();

  shape.moveTo( x, y + radius );
  shape.lineTo( x, y + height - radius );
  shape.quadraticCurveTo( x, y + height, x + radius, y + height );
  shape.lineTo( x + width - radius, y + height );
  shape.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
  shape.lineTo( x + width, y + radius );
  shape.quadraticCurveTo( x + width, y, x + width - radius, y );
  shape.lineTo( x + radius, y );
  shape.quadraticCurveTo( x, y, x, y + radius );

  const geometry = new THREE.ExtrudeBufferGeometry(
    shape,
    { depth: depth, bevelEnabled: false, curveSegments: 3 }
  );

  return geometry;

}

class Cube {

  constructor( game ) {

    this.game = game;
    this.size = parseInt(selectedCube);

    this.geometry = {
      pieceCornerRadius: 0.12,
      edgeCornerRoundness: 0.15,
      edgeScale: 0.82,
      edgeDepth: 0.01,
    };

    this.holder = new THREE.Object3D();
    this.object = new THREE.Object3D();
    this.animator = new THREE.Object3D();

    this.holder.add( this.animator );
    this.animator.add( this.object );

    this.game.world.scene.add( this.holder );

  }

  init() {

    this.cubes = [];
    this.object.children = [];
    this.object.add( this.game.controls.group );

    if ( this.size === 2 ) this.scale = 1.25;
    else if ( this.size === 3 ) this.scale = 1;
    else if ( this.size > 3 ) this.scale = 3 / this.size;

    this.object.scale.set( this.scale, this.scale, this.scale );

    const controlsScale = this.size === 2 ? 0.825 : 1;
    this.game.controls.edges.scale.set( controlsScale, controlsScale, controlsScale );
    
    this.generatePositions();
    this.generateModel();

    this.pieces.forEach( piece => {

      this.cubes.push( piece.userData.cube );
      this.object.add( piece );

    } );

    this.holder.traverse( node => {

      if ( node.frustumCulled ) node.frustumCulled = false;

    } );

    this.updateColors( this.game.themes.getColors() );

    this.sizeGenerated = this.size;

  }

  resize( force = false ) {

    if ( this.size !== this.sizeGenerated || force ) {

      this.size = this.game.preferences.ranges.size.value;

      this.reset();
      this.init();

      this.game.saved = false;
      this.game.timer.reset();
      this.game.storage.clearGame();

    }

  }

  reset() {

    this.game.controls.edges.rotation.set( 0, 0, 0 );

    this.holder.rotation.set( 0, 0, 0 );
    this.object.rotation.set( 0, 0, 0 );
    this.animator.rotation.set( 0, 0, 0 );

  }

  generatePositions() {

    const m = this.size - 1;
    const first = this.size % 2 !== 0
      ? 0 - Math.floor(this.size / 2)
      : 0.5 - this.size / 2;

    let x, y, z;

    this.positions = [];

    for ( x = 0; x < this.size; x ++ ) {
      for ( y = 0; y < this.size; y ++ ) {
        for ( z = 0; z < this.size; z ++ ) {

          let position = new THREE.Vector3(first + x, first + y, first + z);
          let edges = [];

          if ( x == 0 ) edges.push(0);
          if ( x == m ) edges.push(1);
          if ( y == 0 ) edges.push(2);
          if ( y == m ) edges.push(3);
          if ( z == 0 ) edges.push(4);
          if ( z == m ) edges.push(5);

          position.edges = edges;
          this.positions.push( position );

        }
      }
    }

  }

  generateModel() {

    this.pieces = [];
    this.edges = [];

    const pieceSize = 1 / 3;

    const mainMaterial = new THREE.MeshLambertMaterial();

    const pieceMesh = new THREE.Mesh(
      new RoundedBoxGeometry( pieceSize, this.geometry.pieceCornerRadius, 3 ),
      mainMaterial.clone()
    );

    const edgeGeometry = RoundedPlaneGeometry(
      pieceSize,
      this.geometry.edgeCornerRoundness,
      this.geometry.edgeDepth
    );

    this.positions.forEach( ( position, index ) => {

      const piece = new THREE.Object3D();
      const pieceCube = pieceMesh.clone();
      const pieceEdges = [];

      piece.position.copy( position.clone().divideScalar( 3 ) );
      piece.add( pieceCube );
      piece.name = index;
      piece.edgesName = '';

      position.edges.forEach( position => {

        const edge = new THREE.Mesh( edgeGeometry, mainMaterial.clone() );
        const name = [ 'L', 'R', 'D', 'U', 'B', 'F' ][ position ];
        const distance = pieceSize / 2;

        edge.position.set(
          distance * [ - 1, 1, 0, 0, 0, 0 ][ position ],
          distance * [ 0, 0, - 1, 1, 0, 0 ][ position ],
          distance * [ 0, 0, 0, 0, - 1, 1 ][ position ]
        );

        edge.rotation.set(
          Math.PI / 2 * [ 0, 0, 1, - 1, 0, 0 ][ position ],
          Math.PI / 2 * [ - 1, 1, 0, 0, 2, 0 ][ position ],
          0
        );

        edge.scale.set(
          this.geometry.edgeScale,
          this.geometry.edgeScale,
          this.geometry.edgeScale
        );

        edge.name = name;

        piece.add( edge );
        pieceEdges.push( name );
        this.edges.push( edge );

      } );

      piece.userData.edges = pieceEdges;
      piece.userData.cube = pieceCube;

      piece.userData.start = {
        position: piece.position.clone(),
        rotation: piece.rotation.clone(),
      };

      this.pieces.push( piece );

    } );

  }

  updateColors( colors ) {

    if ( typeof this.pieces !== 'object' && typeof this.edges !== 'object' ) return;

    this.pieces.forEach( piece => piece.userData.cube.material.color.setHex( colors.P ) );


    /* NOTE: APPLIES COLOR TO CUBE */
    
    /* COLORS TO ALL EDGES */
    // this.edges.forEach( edge => edge.material.color.setHex( colors[ edge.name ] ) );
    
  }
  
  updateEdgesColors( index, color) {
    // this.edge[]
    // let index = 0;
    color = color.slice(1);

    this.edges[index].material.color.setHex(`0x${color}`);
    // console.log(this.edges[0]);

    // this.edges.forEach(edge => {
    //   // console.log(edge);
    //   edge.addEventListener("click", (event) => {
    //     console.log(event.target);
    //   })
    // });

    // for
    
  }

}

const Easing = {

  Power: {

    In: power => {

      power = Math.round( power || 1 );

      return t => Math.pow( t, power );

    },

    Out: power => {

      power = Math.round( power || 1 );

      return t => 1 - Math.abs( Math.pow( t - 1, power ) );

    },

    InOut: power => {

      power = Math.round( power || 1 );

      return t => ( t < 0.5 )
        ? Math.pow( t * 2, power ) / 2
        : ( 1 - Math.abs( Math.pow( ( t * 2 - 1 ) - 1, power ) ) ) / 2 + 0.5;

    },

  },

  Sine: {

    In: () => t => 1 + Math.sin( Math.PI / 2 * t - Math.PI / 2 ),

    Out: () => t => Math.sin( Math.PI / 2 * t ),

    InOut: () => t => ( 1 + Math.sin( Math.PI * t - Math.PI / 2 ) ) / 2,

  },

  Back: {

    Out: s => {

      s = s || 1.70158;

      return t => { return ( t -= 1 ) * t * ( ( s + 1 ) * t + s ) + 1; };

    },

    In: s => {

      s = s || 1.70158;

      return t => { return t * t * ( ( s + 1 ) * t - s ); };

    }

  },

  Elastic: {

    Out: ( amplitude, period ) => {

      let PI2 = Math.PI * 2;

      let p1 = ( amplitude >= 1 ) ? amplitude : 1;
      let p2 = ( period || 0.3 ) / ( amplitude < 1 ? amplitude : 1 );
      let p3 = p2 / PI2 * ( Math.asin( 1 / p1 ) || 0 );

      p2 = PI2 / p2;

      return t => { return p1 * Math.pow( 2, -10 * t ) * Math.sin( ( t - p3 ) * p2 ) + 1 }

    },

  },

};

class Tween extends Animation {

  constructor( options ) {

    super( false );

    this.duration = options.duration || 500;
    this.easing = options.easing || ( t => t );
    this.onUpdate = options.onUpdate || ( () => {} );
    this.onComplete = options.onComplete || ( () => {} );

    this.delay = options.delay || false;
    this.yoyo = options.yoyo ? false : null;

    this.progress = 0;
    this.value = 0;
    this.delta = 0;

    this.getFromTo( options );

    if ( this.delay ) setTimeout( () => super.start(), this.delay );
    else super.start();

    this.onUpdate( this );

  }

  update( delta ) {

    const old = this.value * 1;
    const direction = ( this.yoyo === true ) ? - 1 : 1;

    this.progress += ( delta / this.duration ) * direction;

    this.value = this.easing( this.progress );
    this.delta = this.value - old;

    if ( this.values !== null ) this.updateFromTo();

    if ( this.yoyo !== null ) this.updateYoyo();
    else if ( this.progress <= 1 ) this.onUpdate( this );
    else {

      this.progress = 1;
      this.value = 1;
      this.onUpdate( this );
      this.onComplete( this );
      super.stop();      

    }

  }

  updateYoyo() {

    if ( this.progress > 1 || this.progress < 0 ) {

      this.value = this.progress = ( this.progress > 1 ) ? 1 : 0;
      this.yoyo = ! this.yoyo;

    }

    this.onUpdate( this );

  }

  updateFromTo() {

    this.values.forEach( key => {

      this.target[ key ] = this.from[ key ] + ( this.to[ key ] - this.from[ key ] ) * this.value;

    } );

  }

  getFromTo( options ) {

    if ( ! options.target || ! options.to ) {

      this.values = null;
      return;

    }

    this.target = options.target || null;
    this.from = options.from || {};
    this.to = options.to || null;
    this.values = [];

    if ( Object.keys( this.from ).length < 1 )
      Object.keys( this.to ).forEach( key => { this.from[ key ] = this.target[ key ]; } );

    Object.keys( this.to ).forEach( key => { this.values.push( key ); } );

  }

}

window.addEventListener( 'touchmove', () => {} );
document.addEventListener( 'touchmove',  event => { event.preventDefault(); }, { passive: false } );

class Draggable {

  constructor( element, options ) {

    this.position = {
      current: new THREE.Vector2(),
      start: new THREE.Vector2(),
      delta: new THREE.Vector2(),
      old: new THREE.Vector2(),
      drag: new THREE.Vector2(),
    };

    this.options = Object.assign( {
      calcDelta: false,
    }, options || {} );

    this.element = element;
    this.touch = null;

    this.drag = {

      start: ( event ) => {

        if ( event.type == 'mousedown' && event.which != 1 ) return;
        if ( event.type == 'touchstart' && event.touches.length > 1 ) return;

        this.getPositionCurrent( event );

        if ( this.options.calcDelta ) {

          this.position.start = this.position.current.clone();
          this.position.delta.set( 0, 0 );
          this.position.drag.set( 0, 0 );

        }

        this.touch = ( event.type == 'touchstart' );

        this.onDragStart( this.position );

        window.addEventListener( ( this.touch ) ? 'touchmove' : 'mousemove', this.drag.move, false );
        window.addEventListener( ( this.touch ) ? 'touchend' : 'mouseup', this.drag.end, false );

      },

      move: ( event ) => {

        if ( this.options.calcDelta ) {

          this.position.old = this.position.current.clone();

        }

        this.getPositionCurrent( event );

        if ( this.options.calcDelta ) {

          this.position.delta = this.position.current.clone().sub( this.position.old );
          this.position.drag = this.position.current.clone().sub( this.position.start );

        }

        this.onDragMove( this.position );

      },

      end: ( event ) => {

        this.getPositionCurrent( event );

        this.onDragEnd( this.position );

        window.removeEventListener( ( this.touch ) ? 'touchmove' : 'mousemove', this.drag.move, false );
        window.removeEventListener( ( this.touch ) ? 'touchend' : 'mouseup', this.drag.end, false );

      },

    };

    this.onDragStart = () => {};
    this.onDragMove = () => {};
    this.onDragEnd = () => {};

    this.enable();

    return this;

  }

  enable() {

    this.element.addEventListener( 'touchstart', this.drag.start, false );
    this.element.addEventListener( 'mousedown', this.drag.start, false );

    return this;

  }

  disable() {

    this.element.removeEventListener( 'touchstart', this.drag.start, false );
    this.element.removeEventListener( 'mousedown', this.drag.start, false );

    return this;

  }

  getPositionCurrent( event ) {

    const dragEvent = event.touches
      ? ( event.touches[ 0 ] || event.changedTouches[ 0 ] )
      : event;

      
      this.position.current.set( dragEvent.pageX, dragEvent.pageY );
      // console.log(this.position.current);

  }

  convertPosition( position ) {

    position.x = ( position.x / this.element.offsetWidth ) * 2 - 1;
    position.y = - ( ( position.y / this.element.offsetHeight ) * 2 - 1 );

    return position;

  }

}

const STILL = 0;
const PREPARING = 1;
const ROTATING = 2;
const ANIMATING = 3;

class Controls {

  constructor( game ) {

    this.game = game;

    this.flipConfig = 0;

    this.flipEasings = [ Easing.Power.Out( 3 ), Easing.Sine.Out(), Easing.Back.Out( 1.5 ) ];
    this.flipSpeeds = [ 125, 200, 300 ];

    this.raycaster = new THREE.Raycaster();

    const helperMaterial = new THREE.MeshBasicMaterial( { depthWrite: false, transparent: true, opacity: 0, color: 0x0033ff } );

    this.group = new THREE.Object3D();
    this.group.name = 'controls';
    this.game.cube.object.add( this.group );

    this.helper = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 200, 200 ),
      helperMaterial.clone()
    );

    this.helper.rotation.set( 0, Math.PI / 4, 0 );
    this.game.world.scene.add( this.helper );

    this.edges = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 1, 1, 1 ),
      helperMaterial.clone(),
    );

    this.game.world.scene.add( this.edges );

    this.onSolved = () => { console.log("SOLVED!");};
    this.onMove = () => {};

    this.momentum = [];

    this.scramble = null;
    this.state = STILL;
    this.enabled = false;

    this.initDraggable();

  }

  enable() {

    this.draggable.enable();
    this.enabled = true;

  }

  disable() {

    this.draggable.disable();
    this.enabled = false;

  }

  initDraggable() {

    this.draggable = new Draggable( this.game.dom.game );

    this.draggable.onDragStart = position => {

      if ( this.scramble !== null ) return;
      if ( this.state === PREPARING || this.state === ROTATING ) return;

      this.gettingDrag = this.state === ANIMATING;

      const edgeIntersect = this.getIntersect( position.current, this.edges, false );
      
      if ( edgeIntersect !== false ) {
        
        this.dragIntersect = this.getIntersect( position.current, this.game.cube.cubes, true );
        
      }
      if ( edgeIntersect !== false && this.dragIntersect !== false ) {
        // console.log(edgeIntersect);
        
        this.dragNormal = edgeIntersect.face.normal.round();
        this.flipType = 'layer';

        this.attach( this.helper, this.edges );

        this.helper.rotation.set( 0, 0, 0 );
        this.helper.position.set( 0, 0, 0 );
        this.helper.lookAt( this.dragNormal );
        this.helper.translateZ( 0.5 );
        this.helper.updateMatrixWorld();

        this.detach( this.helper, this.edges );

      } else {

        this.dragNormal = new THREE.Vector3( 0, 0, 1 );
        this.flipType = 'cube';

        this.helper.position.set( 0, 0, 0 );
        this.helper.rotation.set( 0, Math.PI / 4, 0 );
        this.helper.updateMatrixWorld();

      }

      let planeIntersect = this.getIntersect( position.current, this.helper, false );
      if ( planeIntersect === false ) return;

      this.dragCurrent = this.helper.worldToLocal( planeIntersect.point );
      this.dragTotal = new THREE.Vector3();
      this.state = ( this.state === STILL ) ? PREPARING : this.state;

    };

    this.draggable.onDragMove = position => {

      if ( this.scramble !== null ) return;
      if ( this.state === STILL || ( this.state === ANIMATING && this.gettingDrag === false ) ) return;

      const planeIntersect = this.getIntersect( position.current, this.helper, false );
      if ( planeIntersect === false ) return;

      const point = this.helper.worldToLocal( planeIntersect.point.clone() );

      this.dragDelta = point.clone().sub( this.dragCurrent ).setZ( 0 );
      this.dragTotal.add( this.dragDelta );
      this.dragCurrent = point;
      this.addMomentumPoint( this.dragDelta );

      // console.log(point);
      if ( this.state === PREPARING && this.dragTotal.length() > 0.05 ) {

        this.dragDirection = this.getMainAxis( this.dragTotal );

        if ( this.flipType === 'layer' ) {

          const direction = new THREE.Vector3();
          direction[ this.dragDirection ] = 1;

          const worldDirection = this.helper.localToWorld( direction ).sub( this.helper.position );
          const objectDirection = this.edges.worldToLocal( worldDirection ).round();

          this.flipAxis = objectDirection.cross( this.dragNormal ).negate();

          this.selectLayer( this.getLayer( false ) );

        } else {

          const axis = ( this.dragDirection != 'x' )
            ? ( ( this.dragDirection == 'y' && position.current.x > this.game.world.width / 2 ) ? 'z' : 'x' )
            : 'y';

          this.flipAxis = new THREE.Vector3();
          this.flipAxis[ axis ] = 1 * ( ( axis == 'x' ) ? - 1 : 1 );

        }

        this.flipAngle = 0;
        this.state = ROTATING;

      } else if ( this.state === ROTATING ) {

        const rotation = this.dragDelta[ this.dragDirection ];

        if ( this.flipType === 'layer' && selectedCube === "3") { 

          // NOTE: ROTATES LAYERS
          this.group.rotateOnAxis( this.flipAxis, rotation );
          this.flipAngle += rotation; 
          console.log(this.flipAxis, rotation, this.flipAngle);

        } else {

          this.edges.rotateOnWorldAxis( this.flipAxis, rotation );
          this.game.cube.object.rotation.copy( this.edges.rotation );
          this.flipAngle += rotation;

        }

      }

    };

    // function rotate() {
    //   console.log("ROTATING");
    // }

    // function onDragEnd() {
    //   console.log("TEST HEHEHE");
    // }
    // this.draggable.onDragEnd = abc => onDragEnd();

    this.draggable.onDragEnd = position => {

      if ( this.scramble !== null ) return;
      if ( this.state !== ROTATING ) {

        this.gettingDrag = false;
        this.state = STILL;
        return;

      }

      this.state = ANIMATING;

      const momentum = this.getMomentum()[ this.dragDirection ];
      const flip = ( Math.abs( momentum ) > 0.05 && Math.abs( this.flipAngle ) < Math.PI / 2 );

      const angle = flip
        ? this.roundAngle( this.flipAngle + Math.sign( this.flipAngle ) * ( Math.PI / 4 ) )
        : this.roundAngle( this.flipAngle );

      const delta = angle - this.flipAngle;
      // console.log(this.flipType);
      

      if ( this.flipType === 'layer' && selectedCube === "3") {

        this.rotateLayer( delta, false, layer => {

          // this.game.storage.saveGame();
          
          this.state = this.gettingDrag ? PREPARING : STILL;
          this.gettingDrag = false;

          this.checkIsSolved();

        } );

      } else {

        this.rotateCube( delta, () => {

          this.state = this.gettingDrag ? PREPARING : STILL;
          this.gettingDrag = false;

        } );

      }

    };

  }

  rotateLayer( rotation, scramble, callback ) {
    // console.log(rotation, scramble);
    const config = scramble ? 0 : this.flipConfig;

    const easing = this.flipEasings[ config ];
    const duration = this.flipSpeeds[ config ];
    const bounce = ( config == 2 ) ? this.bounceCube() : ( () => {} );

    this.rotationTween = new Tween( {
      easing: easing,
      duration: duration,
      onUpdate: tween => {

        let deltaAngle = tween.delta * rotation;
        this.group.rotateOnAxis( this.flipAxis, deltaAngle );
        bounce( tween.value, deltaAngle, rotation );

      },
      onComplete: () => {

        if ( ! scramble ) this.onMove();

        const layer = this.flipLayer.slice( 0 );

        this.game.cube.object.rotation.setFromVector3( this.snapRotation( this.game.cube.object.rotation.toVector3() ) );
        this.group.rotation.setFromVector3( this.snapRotation( this.group.rotation.toVector3() ) );
        this.deselectLayer( this.flipLayer );

        // callback( layer );

      },
    } );

  }

  bounceCube() {

    let fixDelta = true;

    return ( progress, delta, rotation ) => {

        if ( progress >= 1 ) {

          if ( fixDelta ) {

            delta = ( progress - 1 ) * rotation;
            fixDelta = false;

          }

          this.game.cube.object.rotateOnAxis( this.flipAxis, delta );

        }

    }

  }

  rotateCube( rotation, callback ) {

    const config = this.flipConfig;
    const easing = [ Easing.Power.Out( 4 ), Easing.Sine.Out(), Easing.Back.Out( 2 ) ][ config ];
    const duration = [ 100, 150, 350 ][ config ];

    this.rotationTween = new Tween( {
      easing: easing,
      duration: duration,
      onUpdate: tween => {

        this.edges.rotateOnWorldAxis( this.flipAxis, tween.delta * rotation );
        this.game.cube.object.rotation.copy( this.edges.rotation );

      },
      onComplete: () => {

        this.edges.rotation.setFromVector3( this.snapRotation( this.edges.rotation.toVector3() ) );
        this.game.cube.object.rotation.copy( this.edges.rotation );
        callback();

      },
    } );

  }

  selectLayer( layer ) {

    this.group.rotation.set( 0, 0, 0 );
    this.movePieces( layer, this.game.cube.object, this.group );
    this.flipLayer = layer;

  }

  deselectLayer( layer ) {

    this.movePieces( layer, this.group, this.game.cube.object );
    this.flipLayer = null;

  }

  movePieces( layer, from, to ) {

    from.updateMatrixWorld();
    to.updateMatrixWorld();

    layer.forEach( index => {

      const piece = this.game.cube.pieces[ index ];

      piece.applyMatrix( from.matrixWorld );
      from.remove( piece );
      piece.applyMatrix( new THREE.Matrix4().getInverse( to.matrixWorld ) );
      to.add( piece );

    } );

  }

  getLayer( position ) {

    const scalar = { 2: 6, 3: 3, 4: 4, 5: 3 }[ this.game.cube.size ];
    const layer = [];

    let axis;

    if ( position === false ) {

      const piece = this.dragIntersect.object.parent;

      axis = this.getMainAxis( this.flipAxis );
      position = piece.position.clone() .multiplyScalar( scalar ) .round();

    } else {

      axis = this.getMainAxis( position );

    }

    this.game.cube.pieces.forEach( piece => {

      const piecePosition = piece.position.clone().multiplyScalar( scalar ).round();

      if ( piecePosition[ axis ] == position[ axis ] ) layer.push( piece.name );

    } );

    // console.log(layer);
    return layer;

  }

  // keyboardMove( type, move, callback ) {

  //   if ( this.state !== STILL ) return;
  //   if ( this.enabled !== true ) return;

  //   if ( type === 'LAYER' ) {

  //     const layer = this.getLayer( move.position );

  //     this.flipAxis = new THREE.Vector3();
  //     this.flipAxis[ move.axis ] = 1;
  //     this.state = ROTATING;

  //     this.selectLayer( layer );
  //     this.rotateLayer( move.angle, false, layer => {

  //       this.game.storage.saveGame();
  //       this.state = STILL;
  //       this.checkIsSolved();

  //     } );

  //   } else if ( type === 'CUBE' ) {

  //     this.flipAxis = new THREE.Vector3();
  //     this.flipAxis[ move.axis ] = 1;
  //     this.state = ROTATING;

  //     this.rotateCube( move.angle, () => {

  //       this.state = STILL;

  //     } );

  //   }

  // }

  scrambleCube() {

    if ( this.scramble == null ) {

      this.scramble = this.game.scrambler;
      this.scramble.callback = ( typeof callback !== 'function' ) ? () => {} : callback;

    }

    const converted = this.scramble.converted;
    // console.log(converted);
    const move = converted[ 0 ];
    const layer = this.getLayer( move.position );

    this.flipAxis = new THREE.Vector3();
    this.flipAxis[ move.axis ] = 1;

    this.selectLayer( layer );
    this.rotateLayer( move.angle, true, () => {

      converted.shift();

      if ( converted.length > 0 ) {

        this.scrambleCube();

      } else {

        this.scramble = null;
        this.game.storage.saveGame();

      }

    } );

  }

  getIntersect( position, object, multiple ) {

    this.raycaster.setFromCamera(
      this.draggable.convertPosition( position.clone() ),
      this.game.world.camera
    );

    const intersect = ( multiple )
      ? this.raycaster.intersectObjects( object )
      : this.raycaster.intersectObject( object );

    return ( intersect.length > 0 ) ? intersect[ 0 ] : false;

  }

  getMainAxis( vector ) {

    return Object.keys( vector ).reduce(
      ( a, b ) => Math.abs( vector[ a ] ) > Math.abs( vector[ b ] ) ? a : b
    );

  }

  detach( child, parent ) {

    child.applyMatrix( parent.matrixWorld );
    parent.remove( child );
    this.game.world.scene.add( child );

  }

  attach( child, parent ) {

    child.applyMatrix( new THREE.Matrix4().getInverse( parent.matrixWorld ) );
    this.game.world.scene.remove( child );
    parent.add( child );

  }

  addMomentumPoint( delta ) {

    const time = Date.now();

    this.momentum = this.momentum.filter( moment => time - moment.time < 500 );

    if ( delta !== false ) this.momentum.push( { delta, time } );

  }

  getMomentum() {

    const points = this.momentum.length;
    const momentum = new THREE.Vector2();

    this.addMomentumPoint( false );

    this.momentum.forEach( ( point, index ) => {

      momentum.add( point.delta.multiplyScalar( index / points ) );

    } );

    return momentum;

  }

  roundAngle( angle ) {

    const round = Math.PI / 2;
    return Math.sign( angle ) * Math.round( Math.abs( angle) / round ) * round;

  }

  snapRotation( angle ) {

    return angle.set(
      this.roundAngle( angle.x ),
      this.roundAngle( angle.y ),
      this.roundAngle( angle.z )
    );

  }

  checkIsSolved() {

    const start = performance.now();

    let solved = true;
    const sides = { 'x-': [], 'x+': [], 'y-': [], 'y+': [], 'z-': [], 'z+': [] };

    this.game.cube.edges.forEach( edge => {

      const position = edge.parent
        .localToWorld( edge.position.clone() )
        .sub( this.game.cube.object.position );

      const mainAxis = this.getMainAxis( position );
      const mainSign = position.multiplyScalar( 2 ).round()[ mainAxis ] < 1 ? '-' : '+';

      sides[ mainAxis + mainSign ].push( edge.name );

    } );

    // console.log(this.game.cube.edges);


    Object.keys( sides ).forEach( side => {
      
      if ( ! sides[ side ].every( value => value === sides[ side ][ 0 ] ) ) {
        solved = false;
      }

    } );

    if ( solved ) this.onSolved();
  }

}

class Scrambler {

  constructor( game ) {

    this.game = game;

    this.dificulty = 0;

    this.scrambleLength = {
      2: [ 7, 9, 11 ],
      3: [ 20, 25, 30 ],
      4: [ 30, 40, 50 ],
      5: [ 40, 60, 80 ],
    };

    this.moves = [];
    this.conveted = [];
    this.pring = '';

  }

  scramble( scramble ) {

    let count = 0;
    this.moves = ( typeof scramble !== 'undefined' ) ? scramble.split( ' ' ) : [];

    if ( this.moves.length < 1 ) {

      const scrambleLength = this.scrambleLength[ this.game.cube.size ][ this.dificulty ];

      const faces = this.game.cube.size < 4 ? 'UDLRFB' : 'UuDdLlRrFfBb';
      const modifiers = [ "", "'", "2" ];
      const total = ( typeof scramble === 'undefined' ) ? scrambleLength : scramble;

      while ( count < total ) {

        const move =
          faces[ Math.floor( Math.random() * faces.length ) ] +
          modifiers[ Math.floor( Math.random() * 3 ) ];

        if ( count > 0 && move.charAt( 0 ) == this.moves[ count - 1 ].charAt( 0 ) ) continue;
        if ( count > 1 && move.charAt( 0 ) == this.moves[ count - 2 ].charAt( 0 ) ) continue;

        this.moves.push( move );
        count ++;

      }

    }

    this.callback = () => {};
    this.convert();
    this.print = this.moves.join( ' ' );

    return this;

  }

  convert( moves ) {

    this.converted = [];

    this.moves.forEach( move => {

      const convertedMove = this.convertMove( move );
      const modifier = move.charAt( 1 );

      this.converted.push( convertedMove );
      if ( modifier == "2" ) this.converted.push( convertedMove );

    } );

  }

  convertMove( move ) {

    const face = move.charAt( 0 );
    const modifier = move.charAt( 1 );

    const axis = { D: 'y', U: 'y', L: 'x', R: 'x', F: 'z', B: 'z' }[ face.toUpperCase() ];
    let row = { D: -1, U: 1, L: -1, R: 1, F: 1, B: -1 }[ face.toUpperCase() ];

    if ( this.game.cube.size > 3 && face !== face.toLowerCase() ) row = row * 2;

    const position = new THREE.Vector3();
    position[ { D: 'y', U: 'y', L: 'x', R: 'x', F: 'z', B: 'z' }[ face.toUpperCase() ] ] = row;

    const angle = ( Math.PI / 2 ) * - row * ( ( modifier == "'" ) ? - 1 : 1 );

    return { position, axis, angle, name: move };

  }

}

class Transition {

  constructor( game ) {

    this.game = game;

    this.tweens = {};
    this.durations = {};
    this.data = {
      cubeY: -0.2,
      cameraZoom: 0.85,
    };

    this.activeTransitions = 0;

  }

  init() {

    // this.game.controls.disable();

    this.game.cube.object.position.y = this.data.cubeY;
    this.game.cube.animator.position.y = 4;
    this.game.cube.animator.rotation.x = - Math.PI / 3;
    this.game.world.camera.zoom = this.data.cameraZoom;
    this.game.world.camera.updateProjectionMatrix();
  }


  cube( show, theming = false ) {

    this.activeTransitions++;

    try { this.tweens.cube.stop(); } catch(e) {}
    const currentY = this.game.cube.animator.position.y;
    const currentRotation = this.game.cube.animator.rotation.x;

    this.tweens.cube = new Tween( {
      duration: show ? 3000 : 1250,
      easing: show ? Easing.Elastic.Out( 0.8, 0.6 ) : Easing.Back.In( 1 ),
      onUpdate: tween => {

        this.game.cube.animator.position.y = show
          ? ( theming ? 0.9 + ( 1 - tween.value ) * 3.5 : ( 1 - tween.value ) * 4 )
          : currentY + tween.value * 4;

        this.game.cube.animator.rotation.x = show
          ? ( 1 - tween.value ) * Math.PI / 3
          : currentRotation + tween.value * - Math.PI / 3;

      },
    } );

    if ( theming ) {

      if ( show ) {

        this.game.world.camera.zoom = 0.75;
        this.game.world.camera.updateProjectionMatrix();

      } else {

        setTimeout( () => {

          this.game.world.camera.zoom = this.data.cameraZoom;
          this.game.world.camera.updateProjectionMatrix();

        }, 1500 );

      }

    }

    this.durations.cube = show ? 1500 : 1500;

    setTimeout( () => this.activeTransitions--, this.durations.cube );

  }

  float() {

    try { this.tweens.float.stop(); } catch(e) {}
    this.tweens.float = new Tween( {
      duration: 1500,
      easing: Easing.Sine.InOut(),
      yoyo: true,
      onUpdate: tween => {

        this.game.cube.holder.position.y = (- 0.02 + tween.value * 0.04); 
        this.game.cube.holder.rotation.x = 0.005 - tween.value * 0.01;
        this.game.cube.holder.rotation.z = - this.game.cube.holder.rotation.x;
        this.game.cube.holder.rotation.y = this.game.cube.holder.rotation.x;

        this.game.controls.edges.position.y =
          this.game.cube.holder.position.y + this.game.cube.object.position.y;

      },
    } );

  }

  zoom( play, time ) {

    this.activeTransitions++;

    const zoom = ( play ) ? 1 : this.data.cameraZoom;
    const duration = ( time > 0 ) ? Math.max( time, 1500 ) : 1500;
    const rotations = ( time > 0 ) ? Math.round( duration / 1500 ) : 1;
    const easing = Easing.Power.InOut( ( time > 0 ) ? 2 : 3 );

    this.tweens.zoom = new Tween( {
      target: this.game.world.camera,
      duration: duration,
      easing: easing,
      to: { zoom: zoom },
      onUpdate: () => { this.game.world.camera.updateProjectionMatrix(); },
    } );

    this.tweens.rotate = new Tween( {
      target: this.game.cube.animator.rotation,
      duration: duration,
      easing: easing,
      to: { y: - Math.PI * 2 * rotations },
      onComplete: () => { this.game.cube.animator.rotation.y = 0; },
    } );

    this.durations.zoom = duration;

    setTimeout( () => this.activeTransitions--, this.durations.zoom );

  }

  elevate( complete ) {

    this.activeTransitions++;

    this.tweens.elevate = new Tween( {
      target: this.game.cube.object.position,
      duration: complete ? 1500 : 0,
      easing: Easing.Power.InOut( 3 ),
      to: { y: complete ? -0.05 : this.data.cubeY }
    } );

    this.durations.elevate = 1500;

    setTimeout( () => this.activeTransitions--, this.durations.elevate );

  }

  complete( show, best ) {

    this.activeTransitions++;

    const text = best ? this.game.dom.texts.best : this.game.dom.texts.complete;

    if ( text.querySelector( 'span i' ) === null )
      text.querySelectorAll( 'span' ).forEach( span => this.splitLetters( span ) );

    const letters = text.querySelectorAll( '.icon, i' );

    this.flipLetters( best ? 'best' : 'complete', letters, show );

    text.style.opacity = 1;

    const duration = this.durations[ best ? 'best' : 'complete' ];

    if ( ! show ) setTimeout( () => this.game.dom.texts.timer.style.transform = '', duration );

    setTimeout( () => this.activeTransitions--, duration );

  }


}

class Timer extends Animation {

  constructor( game ) {

    super( false );

    this.game = game;
    this.reset();
    
  }

  start( continueGame ) {

    this.startTime = continueGame ? ( Date.now() - this.deltaTime ) : Date.now();
    this.deltaTime = 0;
    this.converted = this.convert();

    super.start();

  }

  reset() {

    this.startTime = 0;
    this.currentTime = 0;
    this.deltaTime = 0;
    this.converted = '0:00';

  }

  stop() {

    this.currentTime = Date.now();
    this.deltaTime = this.currentTime - this.startTime;
    this.convert();

    super.stop();

    return { time: this.converted, millis: this.deltaTime };

  }

  update() {

    const old = this.converted;

    this.currentTime = Date.now();
    this.deltaTime = this.currentTime - this.startTime;
    this.convert();

    if ( this.converted != old ) {

      localStorage.setItem( 'theCube_time', this.deltaTime );
      // this.setText();

    }

  }

  convert() {

    const seconds = parseInt( ( this.deltaTime / 1000 ) % 60 );
    const minutes = parseInt( ( this.deltaTime / ( 1000 * 60 ) ) );

    this.converted = minutes + ':' + ( seconds < 10 ? '0' : '' ) + seconds;

  }

  setText() {

    this.game.dom.texts.timer.innerHTML = this.converted;

  }

}

class Preferences {

  constructor( game ) {

    this.game = game;

  }

  init() {

    this.ranges = {

      size: new Range( 'size', {
        value: this.game.cube.size,
        range: [ 2, 5 ],
        step: 1,
        onUpdate: value => {

          // this.game.cube.size = value;

          this.game.preferences.ranges.scramble.list.forEach( ( item, i ) => {

            item.innerHTML = this.game.scrambler.scrambleLength[ this.game.cube.size ][ i ];

          } );

        },
        onComplete: () => this.game.storage.savePreferences(),
      } ),

      flip: new Range( 'flip', {
        value: this.game.controls.flipConfig,
        range: [ 0, 2 ],
        step: 1,
        onUpdate: value => {

          this.game.controls.flipConfig = value;

        },
        onComplete: () => this.game.storage.savePreferences(),
      } ),

      scramble: new Range( 'scramble', {
        value: this.game.scrambler.dificulty,
        range: [ 0, 2 ],
        step: 1,
        onUpdate: value => {

          this.game.scrambler.dificulty = value;

        },
        onComplete: () => this.game.storage.savePreferences()
      } ),

      fov: new Range( 'fov', {
        value: this.game.world.fov,
        range: [ 2, 45 ],
        onUpdate: value => {

          this.game.world.fov = value;
          this.game.world.resize();

        },
        onComplete: () => this.game.storage.savePreferences()
      } ),

      theme: new Range( 'theme', {
        value: { cube: 0, erno: 1, dust: 2, camo: 3, rain: 4 }[ this.game.themes.theme ],
        range: [ 0, 4 ],
        step: 1,
        onUpdate: value => {

          const theme = [ 'cube', 'erno', 'dust', 'camo', 'rain' ][ value ];
          this.game.themes.setTheme( theme );

        },
        onComplete: () => this.game.storage.savePreferences()
      } ),

      hue: new Range( 'hue', {
        value: 0,
        range: [ 0, 360 ],
        onUpdate: value => this.game.themeEditor.updateHSL(),
        onComplete: () => this.game.storage.savePreferences(),
      } ),

      saturation: new Range( 'saturation', {
        value: 100,
        range: [ 0, 100 ],
        onUpdate: value => this.game.themeEditor.updateHSL(),
        onComplete: () => this.game.storage.savePreferences(),
      } ),

      lightness: new Range( 'lightness', {
        value: 50,
        range: [ 0, 100 ],
        onUpdate: value => this.game.themeEditor.updateHSL(),
        onComplete: () => this.game.storage.savePreferences(),
      } ),

    };

    // this.ranges.scramble.list.forEach( ( item, i ) => {

    //   item.innerHTML = this.game.scrambler.scrambleLength[ this.game.cube.size ][ i ];

    // } );
    
  }

}

class Confetti {

  constructor( game ) {

    this.game = game;
    this.started = 0;

    this.options = {
      speed: { min: 0.0011, max: 0.0022 },
      revolution: { min: 0.01, max: 0.05 },
      size: { min: 0.1, max: 0.15 },
      colors: [ 0x41aac8, 0x82ca38, 0xffef48, 0xef3923, 0xff8c0a ],
    };

    this.geometry = new THREE.PlaneGeometry( 1, 1 );
    this.material = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide } );

    this.holders = [
      new ConfettiStage( this.game, this, 1, 20 ),
      new ConfettiStage( this.game, this, -1, 30 ),
    ];

  }

  start() {

    if ( this.started > 0 ) return;

    this.holders.forEach( holder => {

      this.game.world.scene.add( holder.holder );
      holder.start();
      this.started ++;

    } );

  }

  stop() {

    if ( this.started == 0 ) return;

    this.holders.forEach( holder => {

      holder.stop( () => {

        this.game.world.scene.remove( holder.holder );
        this.started --;

      } );

    } );

  }

  updateColors( colors ) {

    // this.holders.forEach( holder => {

    //   holder.options.colors.forEach( ( color, index ) => {

    //     holder.options.colors[ index ] = colors[ [ 'D', 'F', 'R', 'B', 'L' ][ index ] ];

    //   } );

    // } );

  }

}

class ConfettiStage extends Animation {

  constructor( game, parent, distance, count ) {

    super( false );

    this.game = game;
    this.parent = parent;

    this.distanceFromCube = distance;

    this.count = count;
    this.particles = [];

    this.holder = new THREE.Object3D();
    this.holder.rotation.copy( this.game.world.camera.rotation );

    this.object = new THREE.Object3D();
    this.holder.add( this.object );

    this.resizeViewport = this.resizeViewport.bind( this );
    this.game.world.onResize.push( this.resizeViewport );
    this.resizeViewport();    

    this.geometry = this.parent.geometry;
    this.material = this.parent.material;

    this.options = this.parent.options;

    let i = this.count;
    while ( i-- ) this.particles.push( new Particle( this ) );

  }

  start() {

    this.time = performance.now();
    this.playing = true;

    let i = this.count;
    while ( i-- ) this.particles[ i ].reset();

    super.start();

  }

  stop( callback ) {

    this.playing = false;
    this.completed = 0;
    this.callback = callback;

  }

  reset() {

    super.stop();

    this.callback();

  }

  update() {

    const now = performance.now();
    const delta = now - this.time;
    this.time = now;

    let i = this.count;

    while ( i-- )
      if ( ! this.particles[ i ].completed ) this.particles[ i ].update( delta );

    if ( ! this.playing && this.completed == this.count ) this.reset();

  }

  resizeViewport() {

    const fovRad = this.game.world.camera.fov * THREE.Math.DEG2RAD;

    this.height = 2 * Math.tan( fovRad / 2 ) * ( this.game.world.camera.position.length() - this.distanceFromCube );
    this.width = this.height * this.game.world.camera.aspect;

    const scale = 1 / this.game.transition.data.cameraZoom;

    this.width *= scale;
    this.height *= scale;

    this.object.position.z = this.distanceFromCube;
    this.object.position.y = this.height / 2;

  }
  
}

class Particle {

  constructor( confetti ) {

    this.confetti = confetti;
    this.options = this.confetti.options;

    this.velocity = new THREE.Vector3();
    this.force = new THREE.Vector3();

    this.mesh = new THREE.Mesh( this.confetti.geometry, this.confetti.material.clone() );
    this.confetti.object.add( this.mesh );

    this.size = THREE.Math.randFloat( this.options.size.min, this.options.size.max );
    this.mesh.scale.set( this.size, this.size, this.size );

    return this;

  }

  reset( randomHeight = true ) {

    this.completed = false;

    this.color = new THREE.Color( this.options.colors[ Math.floor( Math.random() * this.options.colors.length ) ] );
    this.mesh.material.color.set( this.color );

    this.speed = THREE.Math.randFloat( this.options.speed.min, this.options.speed.max ) * - 1;
    this.mesh.position.x = THREE.Math.randFloat( - this.confetti.width / 2, this.confetti.width / 2 );
    this.mesh.position.y = ( randomHeight )
      ? THREE.Math.randFloat( this.size, this.confetti.height + this.size )
      : this.size;

    this.revolutionSpeed = THREE.Math.randFloat( this.options.revolution.min, this.options.revolution.max );
    this.revolutionAxis = [ 'x', 'y', 'z' ][ Math.floor( Math.random() * 3 ) ];
    this.mesh.rotation.set( Math.random() * Math.PI / 3, Math.random() * Math.PI / 3, Math.random() * Math.PI / 3 );

  }

  stop() {

    this.completed = true;
    this.confetti.completed ++;

  }

  update( delta ) {

    this.mesh.position.y += this.speed * delta;
    this.mesh.rotation[ this.revolutionAxis ] += this.revolutionSpeed;

    if ( this.mesh.position.y < - this.confetti.height - this.size )
      ( this.confetti.playing ) ? this.reset( false ) : this.stop();

  }

}

class Scores {
}

class Storage {

  constructor( game ) {

    this.game = game;

    const userVersion = localStorage.getItem( 'theCube_version' );

    if ( ! userVersion || userVersion !== window.gameVersion ) {

      this.clearGame();
      // this.clearPreferences();
      // this.migrateScores();
      localStorage.setItem( 'theCube_version', window.gameVersion );

    }

  }

  init() {

    this.loadPreferences();
    // this.loadScores();

  }

  loadGame() {

    try {

      const gameInProgress = localStorage.getItem( 'theCube_playing' ) === 'true';

      if ( ! gameInProgress ) throw new Error();

      const gameCubeData = JSON.parse( localStorage.getItem( 'theCube_savedState' ) );
      const gameTime = parseInt( localStorage.getItem( 'theCube_time' ) );

      if ( ! gameCubeData || gameTime === null ) throw new Error();
      if ( gameCubeData.size !== this.game.cube.sizeGenerated ) throw new Error();

      this.game.cube.loadFromData( gameCubeData );

      this.game.timer.deltaTime = gameTime;

      this.game.saved = true;

    } catch( e ) {

      this.game.saved = false;

    }

  }

  saveGame() {

    // const gameInProgress = true;
    // const gameCubeData = { names: [], positions: [], rotations: [] };
    // const gameTime = this.game.timer.deltaTime;

    // gameCubeData.size = this.game.cube.sizeGenerated;

    // this.game.cube.pieces.forEach( piece => {

    //   gameCubeData.names.push( piece.name );
    //   gameCubeData.positions.push( piece.position );
    //   gameCubeData.rotations.push( piece.rotation.toVector3() );

    // } );

    // localStorage.setItem( 'theCube_playing', gameInProgress );
    // localStorage.setItem( 'theCube_savedState', JSON.stringify( gameCubeData ) );
    // localStorage.setItem( 'theCube_time', gameTime );

  }

  clearGame() {

    localStorage.removeItem( 'theCube_playing' );
    localStorage.removeItem( 'theCube_savedState' );
    localStorage.removeItem( 'theCube_time' );

  }

  // loadScores() {

  //   try {

  //   } catch( e ) {}

  // }


  loadPreferences() {

    // try {

    //   const preferences = JSON.parse( localStorage.getItem( 'theCube_preferences' ) );

    //   if ( ! preferences ) throw new Error();

    //   this.game.themes.setTheme( preferences.theme );

    //   return true;

    // } catch (e) {

      this.game.cube.size = parseInt(selectedCube);
      this.game.controls.flipConfig = 0;
      // this.game.scrambler.dificulty = 1;

      this.game.world.fov = 10;
      this.game.world.resize();

      this.game.themes.setTheme( 'cube' );

      // this.savePreferences();

      return false;

    // }

  }

}

class Themes {

  constructor( game ) {

    this.game = game;
    this.theme = null;

    // NOTE: CHANGE COLOR HERE
    this.defaults = {
      cube: {
        U: 0xb2b6c1, // white
        D: 0xb2b6c1, // yellow
        F: 0xb2b6c1, // red
        R: 0xb2b6c1, // blue
        B: 0xb2b6c1, // orange
        L: 0xb2b6c1, // green
        P: 0x08101a, // piece
        G: 0xd1d5db, // background
      }
    };

    this.colors = JSON.parse( JSON.stringify( this.defaults ) );


  }

  getColors() {

    return this.colors[ this.theme ];

  }

  setTheme( theme = false, force = false ) {

    if ( theme === this.theme && force === false ) return;
    if ( theme !== false ) this.theme = theme;

    const colors = this.getColors();

    this.game.cube.updateColors( colors );

    // this.game.confetti.updateColors( colors );

    this.game.dom.back.style.background = '#' + colors.G.toString(16).padStart(6, '0');

  }

}

class ThemeEditor {

  constructor( game ) {

    this.game = game;
    this.getPieceColor = this.getPieceColor.bind( this );

  }

  colorFromHSL( h, s, l ) {

    h = Math.round( h );
    s = Math.round( s );
    l = Math.round( l );

    return new THREE.Color( `hsl(${h}, ${s}%, ${l}%)` );

  }

  setHSL( color = null, animate = false ) {

    this.editColor = ( color === null) ? 'R' : color;

    const hsl = new THREE.Color( this.game.themes.getColors()[ this.editColor ] );

    const { h, s, l } = hsl.getHSL( hsl );
    const { hue, saturation, lightness } = this.game.preferences.ranges;

    if ( animate ) {

      const ho = hue.value / 360;
      const so = saturation.value / 100;
      const lo = lightness.value / 100;

      const colorOld = this.colorFromHSL( hue.value, saturation.value, lightness.value );

      if ( this.tweenHSL ) this.tweenHSL.stop();

      this.tweenHSL = new Tween( {
        duration: 200,
        easing: Easing.Sine.Out(),
        onUpdate: tween => {

          hue.setValue( ( ho + ( h - ho ) * tween.value ) * 360 );
          saturation.setValue( ( so + ( s - so ) * tween.value ) * 100 );
          lightness.setValue( ( lo + ( l - lo ) * tween.value ) * 100 );

          const colorTween = colorOld.clone().lerp( hsl, tween.value );

          const colorTweenStyle = colorTween.getStyle();
          const colorTweenHex = colorTween.getHSL( colorTween );

          hue.handle.style.color = colorTweenStyle;
          saturation.handle.style.color = colorTweenStyle;
          lightness.handle.style.color = colorTweenStyle;

          saturation.track.style.color =
            this.colorFromHSL( colorTweenHex.h * 360, 100, 50 ).getStyle();
          lightness.track.style.color =
            this.colorFromHSL( colorTweenHex.h * 360, colorTweenHex.s * 100, 50 ).getStyle();

          this.game.dom.theme.style.display = 'none';
          this.game.dom.theme.offsetHeight;
          this.game.dom.theme.style.display = '';

        },
        onComplete: () => {

          this.updateHSL();
          this.game.storage.savePreferences();

        },
      } );

    } else {

      hue.setValue( h * 360 );
      saturation.setValue( s * 100 );
      lightness.setValue( l * 100 );

      this.updateHSL();
      // this.game.storage.savePreferences();

    }

  }
  updateHSL() {

    const { hue, saturation, lightness } = this.game.preferences.ranges;

    const h = hue.value;
    const s = saturation.value;
    const l = lightness.value;

    const color = this.colorFromHSL( h, s, l ).getStyle();

    hue.handle.style.color = color;
    saturation.handle.style.color = color;
    lightness.handle.style.color = color;

    saturation.track.style.color = this.colorFromHSL( h, 100, 50 ).getStyle();
    lightness.track.style.color = this.colorFromHSL( h, s, 50 ).getStyle();

    this.game.dom.theme.style.display = 'none';
    this.game.dom.theme.offsetHeight;
    this.game.dom.theme.style.display = '';

    const theme = this.game.themes.theme;

    this.game.themes.colors[ theme ][ this.editColor ] = this.colorFromHSL( h, s, l ).getHex();
    this.game.themes.setTheme();

  }

  colorPicker( enable ) {

    if ( enable ) {

      this.game.dom.game.addEventListener( 'click', this.getPieceColor, false );

    } else {

      this.game.dom.game.removeEventListener( 'click', this.getPieceColor, false );

    }

  }

  getPieceColor( event ) {

    const clickEvent = event.touches
      ? ( event.touches[ 0 ] || event.changedTouches[ 0 ] )
      : event;

    const clickPosition = new THREE.Vector2( clickEvent.pageX, clickEvent.pageY );
    
    let edgeIntersect = this.game.controls.getIntersect( clickPosition, this.game.cube.edges, true );
    let pieceIntersect = this.game.controls.getIntersect( clickPosition, this.game.cube.cubes, true );
    
    if ( edgeIntersect !== false ) {

      const edge = edgeIntersect.object;
      
      const position = edge.parent
      .localToWorld( edge.position.clone() )
        .sub( this.game.cube.object.position )
        .sub( this.game.cube.animator.position );
        
        const mainAxis = this.game.controls.getMainAxis( position );
        if ( position.multiplyScalar( 2 ).round()[ mainAxis ] < 1 ) edgeIntersect = false;
        
      }
      
      const name = edgeIntersect ? edgeIntersect.object.name : pieceIntersect ? 'P' : 'G';
      // console.log(clickPosition, name);

    // this.setHSL( name, true );

  }

}

const States = {
  3: {
    checkerboard: {
      names: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26 ],
      positions: [
        { "x": 1/3, "y": -1/3, "z": 1/3 },
        { "x": -1/3, "y": 1/3, "z": 0 },
        { "x": 1/3, "y": -1/3, "z": -1/3 },
        { "x": -1/3, "y": 0, "z": -1/3 },
        { "x": 1/3, "y": 0, "z": 0 },
        { "x": -1/3, "y": 0, "z": 1/3 },
        { "x": 1/3, "y": 1/3, "z": 1/3 },
        { "x": -1/3, "y": -1/3, "z": 0 },
        { "x": 1/3, "y": 1/3, "z": -1/3 },
        { "x": 0, "y": 1/3, "z": -1/3 },
        { "x": 0, "y": -1/3, "z": 0 },
        { "x": 0, "y": 1/3, "z": 1/3 },
        { "x": 0, "y": 0, "z": 1/3 },
        { "x": 0, "y": 0, "z": 0 },
        { "x": 0, "y": 0, "z": -1/3 },
        { "x": 0, "y": -1/3, "z": -1/3 },
        { "x": 0, "y": 1/3, "z": 0 },
        { "x": 0, "y": -1/3, "z": 1/3 },
        { "x": -1/3, "y": -1/3, "z": 1/3 },
        { "x": 1/3, "y": 1/3, "z": 0 },
        { "x": -1/3, "y": -1/3, "z": -1/3 },
        { "x": 1/3, "y": 0, "z": -1/3 },
        { "x": -1/3, "y": 0, "z": 0 },
        { "x": 1/3, "y": 0, "z": 1/3 },
        { "x": -1/3, "y": 1/3, "z": 1/3 },
        { "x": 1/3, "y": -1/3, "z": 0 },
        { "x": -1/3, "y": 1/3, "z": -1/3 }
      ],
      rotations: [
        { "x": -Math.PI, "y": 0, "z": Math.PI, },
        { "x": Math.PI, "y": 0, "z": 0 },
        { "x": -Math.PI, "y": 0, "z": Math.PI },
        { "x": 0, "y": 0, "z": 0 },
        { "x": 0, "y": 0, "z": Math.PI },
        { "x": 0, "y": 0, "z": 0 },
        { "x": -Math.PI, "y": 0, "z": Math.PI },
        { "x": Math.PI, "y": 0, "z": 0 },
        { "x": -Math.PI, "y": 0, "z": Math.PI },
        { "x": 0, "y": 0, "z": Math.PI },
        { "x": 0, "y": 0, "z": 0 },
        { "x": 0, "y": 0, "z": Math.PI },
        { "x": -Math.PI, "y": 0, "z": 0 },
        { "x": Math.PI, "y": 0, "z": Math.PI },
        { "x": Math.PI, "y": 0, "z": 0 },
        { "x": 0, "y": 0, "z": Math.PI },
        { "x": 0, "y": 0, "z": 0 },
        { "x": 0, "y": 0, "z": Math.PI },
        { "x": Math.PI, "y": 0, "z": Math.PI },
        { "x": -Math.PI, "y": 0, "z": 0 },
        { "x": Math.PI, "y": 0, "z": Math.PI },
        { "x": 0, "y": 0, "z": 0 },
        { "x": 0, "y": 0, "z": Math.PI },
        { "x": 0, "y": 0, "z": 0 },
        { "x": Math.PI, "y": 0, "z": Math.PI },
        { "x": -Math.PI, "y": 0, "z": 0 },
        { "x": Math.PI, "y": 0, "z": Math.PI }
      ],
      size: 3,
    },
  }
};


const STATE = {
  Menu: 0,
  Playing: 1,
  Complete: 2,
  Stats: 3,
  Prefs: 4,
  Theme: 5,
};

const BUTTONS = {
  Menu: [ 'stats', 'prefs' ],
  Playing: [ 'back' ],
  Complete: [],
  Stats: [],
  Prefs: [ 'back', 'theme' ],
  Theme: [ 'back', 'reset' ],
  None: [],
};

const SHOW = true;
const HIDE = false;

class Game {

  constructor() {

    this.dom = {
      ui: document.querySelector( '.ui' ),
      game: document.querySelector( '.ui__game' ),
      back: document.querySelector( '.ui__background' ),
      prefs: document.querySelector( '.ui__prefs' ),
      theme: document.querySelector( '.ui__theme' ),
      stats: document.querySelector( '.ui__stats' ),
      texts: {
        title: document.querySelector( '.text--title' ),
        note: document.querySelector( '.text--note' ),
        timer: document.querySelector( '.text--timer' ),
        complete: document.querySelector( '.text--complete' ),
        best: document.querySelector( '.text--best-time' ),
        theme: document.querySelector( '.text--theme' ),
      },
      buttons: {
        prefs: document.querySelector( '.btn--prefs' ),
        back: document.querySelector( '.btn--back' ),
        stats: document.querySelector( '.btn--stats' ),
        reset: document.querySelector( '.btn--reset' ),
        theme: document.querySelector( '.btn--theme' ),
      },
    };

    this.world = new World( this );
    this.cube = new Cube( this );
    this.controls = new Controls( this );
    this.scrambler = new Scrambler( this );
    this.transition = new Transition( this );
    this.timer = new Timer( this );
    this.preferences = new Preferences( this );
    this.scores = new Scores( this );
    this.storage = new Storage( this );
    this.confetti = new Confetti( this );
    this.themes = new Themes( this );
    this.themeEditor = new ThemeEditor( this );

    this.initActions();

    this.state = STATE.Menu;
    this.newGame = false;
    this.saved = false;

    this.storage.init();
    this.preferences.init();
    this.cube.init();
    this.transition.init();

    this.storage.loadGame();

    setTimeout( () => {

      this.transition.float();
      this.transition.cube( SHOW );

    }, 500 );

  }

  initActions() {

    // let tappedTwice = false;.

    this.dom.game.addEventListener( 'click', event => {

      if ( this.transition.activeTransitions > 0 ) return;
      if ( this.state === STATE.Playing ) return;

      if ( this.state === STATE.Menu ) {

        // if ( ! tappedTwice ) {

        //   tappedTwice = true;
        //   setTimeout( () => tappedTwice = false, 300 );
        //   return false;

        // }

        // this.game( SHOW );

      // } else if ( this.state === STATE.Complete ) {

      //   // this.complete( HIDE );

      // } else if ( this.state === STATE.Stats ) {

      //   // this.stats( HIDE );

      } 

    }, false );

    this.controls.onMove = () => {

      if ( this.newGame ) {
        
        this.timer.start( true );
        this.newGame = false;

      }

    };

  }

  theme( show ) {

    this.themeEditor.colorPicker( show );
    
  
  }

}

// CREATE GAME/CUBE
// window.version = '0.99.2';
// window.game = new Game();