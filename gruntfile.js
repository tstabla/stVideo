module.exports = function(grunt){

	require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		paths: {
			'dist': 'dist',
			'src': 'src',
		},

		copyright: '/*! \n' +
				' * <%= pkg.name %> \n' +
				' * <%= pkg.description %>\n' +
				' * \n' +
				' * Licensed under the MIT license: \n' +
				' * http://www.opensource.org/licenses/mit-license.php \n' +
				' * \n' +
				' * Any and all use of this script must be accompanied by this copyright/license notice in its present form. \n' +
				' * \n' +
				' * Version: <%= pkg.version %>\n' +
				' * Author: <%= pkg.author.name %> <<%= pkg.author.email %>> (<%= pkg.author.url %>)\n' +
				' * Site: <%= pkg.homepage %>/\n' +
				' */\n' +
				'',

		jshint: {
			src: {
				options: {
					'-W099': true,
					expr: true
				},
				src: [
					'gruntfile.js',
					'<%= paths.src %>/js/**/*.js'
				]
			}
		},

		concat: {
			options: {
				separator: ';',
				banner: '<%= copyright %>'
			},
			dist: {
				src: ['<%= paths.src %>/js/stVideo.js'],
				dest: '<%= paths.dist %>/js/stVideo.js'
			}
		},

		copy : {
			files: {
				expand: true,
				cwd: '<%= paths.src %>',
				src: ['**/fonts/**', '**/css/**'],
				dest: '<%= paths.dist %>/'
			}
		},

		uglify: {
			dist: {
				options: {
					report: 'min',
					banner: '<%= copyright %>',
					sourceMap: true,
				},
				files: [{
					'<%= paths.dist %>/js/stVideo.min.js': ['<%= paths.dist %>/js/stVideo.js']
				}],
			}
		},

		watch: {
			js: {
				files: [
					'<%= paths.src %>/js/**/*.js',
				],
				tasks: ['buildjs']
			}
		}
	});

	grunt.registerTask('default', [
		'copy', 'buildjs', 'watch'
	]);

	grunt.registerTask('build', [
		'copy', 'buildjs'
	]);

	grunt.registerTask('buildjs', [
		'jshint',	'concat', 'uglify',
	]);


};
