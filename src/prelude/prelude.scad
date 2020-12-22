// Prelude contains all the buit-in modules, functions and variables

//
// Control flow
//

// @intrinsic controlFlow
// @intrinsicRename for
module _for();

// @intrinsic controlFlow
module intersection_for();

// 
// 2D
// 



/**
 * Generates a circle at the origin.
 *
 * @param r [positional] [type=number] the radius of the circle
 * @param d [named] [conflictsWith=r] [type=number] the diameter of the circle
 * @see https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Using_the_2D_Subsystem#circle
 **/
module circle(r = radius, d = diameter);

/**
 *  Generates a square or a rectangle.
 *  If center is `false` it is placed in the first quadrant (positive XY), if center is set to `true` it is centered at the origin.
 *
 * @param size [positional] [type=number,vector] The size of the square. Can be a two-dimensional vector [x, y] for a rectangle, or a number for a square.
 * @param center [positional] [type=bool] When set to true the rectangle is placed with the center at the origin of the coordinate system.
 **/
module square(size = [x, y], center = true/false);

module polygon(points);

module text(t, size, font, halign, valign, spacing, direction, language, script);

module projection(cut);

// 
// 3D Solids
// 

module sphere($fn = 0, $fa = 12, $fs = 2, r = 1);

module cube(size = [1, 1, 1], center = false);

module cylinder($fn = 0, $fa = 12, $fs = 2, h = 1, r1 = 1, r2 = 1, center = false);

module polyhedron(points = undef, faces = undef, convexity = 1);

module import(file = "");

module linear_extrude(height, center, convexity, twist, slices);

module rotate_extrude(angle, convexity);

//
// Transformation modules
//

module translate(pos = [x, y, z]);

module rotate(a = 0, v = [x, y, z]);

module scale(pos = [x, y, z]);

module resize(pos = [x, y, z], auto) 

module mirror(pos = [x, y, z]);

module multmatrix(m);

module color(c = [1, 1, 1, 1]);

module hull();

// Offset generates a new 2d interior or exterior outline from an existing outline. 
// There are two modes of operation. radial and offset. 
// The offset method creates a new outline who's sides are a fixed distance outer (delta > 0) or inner (delta < 0) from the original outline. The radial method creates a new outline as if a circle of some radius is rotated around the exterior (r>0} or interior (r<0) original outline. 
module offset(r = 1, delta = 1, chamfer = false);

// Displays the minkowski sum of child nodes. 
module minkowski();

// 
// Constants
// 

PI = 3.141592653589793;

//
// Boolean operations
//

module union();

module difference();

module intersection();


//
// Type test functions
// 

function is_undef(var) = undef;

function is_bool(var) = undef;

function is_num(var) = undef;
function is_string(var) = undef;
function is_list(var) = undef;

// 
// General functions
// 

function concat(a1, a2, a3, a4, a5, a6, a7) = undef;

// Look up value in table, and linearly interpolate if there's no exact match.
// The first argument is the value to look up. 
// The second is the lookup table -- a vector of key-value pairs. 
function lookup(key, tab) = undef;
function str(a1, a2, a3, a4, a5, a6, a7) = undef;
function chr(a) = undef;

// Convert the first character of the given string to a Unicode code point.
function ord(str) = undef;
function search() = undef;
function version() = undef;
function version_num() = undef;

function parent_module(idx) = undef;

// 
// Mathematical functions
// 
function abs(x) = undef;
function sign(x) = undef;
function sin(x) = undef;
function cos(x) = undef;
function tan(x) = undef;
function acos(x) = undef;
function asin(x) = undef;
function atan(x) = undef;
function atan2(x, y) = undef;
function floor(x) = undef;
function round(x) = undef;
function ceil(x) = undef;
function ln(x) = undef;
function len(x) = undef;
function log(x) = undef;
function pow(b, e) = undef;
function sqrt(x) = undef;
function exp(x) = undef;
function rands(x) = undef;
function min(x) = undef;
function max(x) = undef;
function norm(x) = undef;
function cross(x) = undef;
