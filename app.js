/**
 * Symphony 2 scaffold
 */

var 
path = require('path'),
argv = require('optimist')
	.default('name', 'project')
	.default('dir', path.normalize(process.cwd() + path.sep))
	.default('sym-repro', 'git://github.com/symphonycms/symphony-2.git')
	.default('sym-branch', '2.3.2')
	.default('fx-repro', 'git://github.com/DeuxHuitHuit/framework.js.git')
	.default('fx-branch', 'master')
	.default('template-repro', 'git://github.com/DeuxHuitHuit/symphony-2-template.git')
	.default('template-branch', 'master')
	.argv,

fs = require('fs'),
sys = require('sys'),
exec = require('child_process').exec,
_ = require('underscore'),
cmds = [],
cmdRunning = false,
full_dir = argv.dir + argv.name,
run = function (error, stdout, stderr) {
	if (!!argv.v && !!stdout) {
		sys.puts(stdout);
	}
	if (!!stderr) {
		sys.puts(stderr);
	}
	if (!!error) {
		console.log(error);
		//throw error;
	}
	if (!!cmds.length) {
		cmdRunning = true;
		var cmd = cmds.shift();
		execute(cmd, run);
	} else {
		cmdRunning = false;
	}
},
execute = function (cmd, callback) {
	console.log(cmd.cmd);
	exec(cmd.cmd, cmd.options, callback);
},
executeQueue = function (cmd) {
	// register into array
	if (_.isString(cmd)) {
		cmd = {
			cmd: cmd,
			options: {}
		};
	}
	cmds.push(cmd);
	
	if (!cmdRunning) {
		run();
	}
},
unGit = function (dir) {
	executeQueue('find '+ full_dir +' -name .git -type d -exec rm -rf {} ;');
	executeQueue('find '+ full_dir +' -name .git -type f -exec rm -f {} ;');
	executeQueue('find '+ full_dir +' -name .gitignore -exec rm -f {} ;');
	executeQueue('find '+ full_dir +' -name .gitmodules -exec rm -f {} ;');
},
doIt = function () {
	
	if (!argv.u) {
		// Symphony
		executeQueue('git clone ' + argv['sym-repro'] + ' ' + full_dir);
		executeQueue({cmd:'git checkout ' + argv['sym-branch'], options:{cwd:full_dir}});
		executeQueue({cmd:'git submodule init ', options:{cwd:full_dir}});
		executeQueue({cmd:'git submodule update ', options:{cwd:full_dir}});
		unGit(full_dir);
		
		// Template
		executeQueue('git clone ' + argv['template-repro'] + ' ' + full_dir + '/template');
		executeQueue({cmd:'git checkout ' + argv['template-branch'], options:{cwd:full_dir + '/template'}});
		unGit(full_dir + '/template');
		executeQueue('mv -f ' + full_dir + '/template/workspace ' + full_dir + '/workspace');
		executeQueue('rm -rf ' + full_dir + '/template');
	}
	
	if (argv.fx) {
		executeQueue('git clone ' + argv['fx-repro'] + ' ' + full_dir + '/fx');
		executeQueue({cmd:'git checkout ' + argv['fx-branch'], options:{cwd:full_dir + '/fx'}});
		unGit(full_dir + '/fx');
		executeQueue('mv -f ' + full_dir + '/fx/dist/* ' + full_dir + '/workspace/assets/js/fx');
		executeQueue('rm -rf ' + full_dir + '/fx');
	}
};

console.log('Welcome in Symphony 2 scaffold');
console.log();
console.log('%s project "%s" in %s', !argv.u ? 'Creating' : 'Updating', argv.name, full_dir);

if (fs.existsSync(full_dir)) {
	if (!argv.d && !argv.u) {
		console.error('Destination folder exists. Use -d in order to continue');
		return;
	}
	else if (!argv.u) {
		//fs.rmdirSync(full_dir);
		execute({cmd:'rm -rf ' + full_dir}, function () {
			fs.mkdirSync(full_dir);
			doIt();
		});
	} else {
		doIt();
	}
} else {
	if (!argv.u) {
		fs.mkdirSync(full_dir);
	}
	doIt();
}


(function timeout() {
	if (!!cmds.length || cmdRunning) {
		setTimeout(timeout, 100);
	} else {
		console.log();
		console.log('Done');
	}
})();