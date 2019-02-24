var generators = require('yeoman-generator');

var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

function decompose(name) {
    return name.replace(/[^a-zA-Z]/g, " ").replace(/\s+/g, " ").trim().split(" ");
}

function camelcase(name) {
    var words = decompose(name);
    for (var i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].slice(1, words[i].length);
    }
    return words.join("");
}

module.exports = yeoman.generators.Base.extend({
    prompting: function () {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay(
            'Welcome to ' + chalk.red('java-gradle-nexus')
        ));

        var dir = this.destinationRoot()
        if (dir.split("/").length > 1) {
            dir = dir.split("/")
            dir = dir[dir.length-1]
        }

        var prompts = [{
            type: 'input',
            name: 'name',
            message: 'Project name',
            default: dir
        }, {
            type: 'input',
            name: 'description',
            message: 'Project description',
            default: ""
        }, {
            type: 'input',
            name: 'package',
            message: 'Java package qualifier (reverse TLD, e.g. com.foobar.application)',
            default: "com.foobar.application"
        }, {
            type: 'input',
            name: 'nexusUrl',
            message: 'Nexus URL',
            default: ""
        }, {
            type: 'input',
            name: 'nexusUsername',
            message: 'Nexus Username',
            default: ""
        }, {
            type: 'input',
            name: 'nexusPassword',
            message: 'Nexus Password',
            default: ""
        }];

        this.prompt(prompts, function (props) {
            props.className = camelcase(props.name);
            props.slug = decompose(props.name).join("-");

            this.props = props;
            // To access props later use this.props.someOption;

            done();
        }.bind(this));
    },

    writing: {
        app: function () {
            // Gradle setup
            var files = [
                "build.gradle",
                "gradle.properties",
                "gradlew",
                "settings.gradle",
                "gradle/java.gradle",
                "gradle/publish.gradle",
                "gradle/repositories.gradle",
                "gradle/wrapper/gradle-wrapper.properties"
            ];
            for (var i = 0; i < files.length; i++) {
                this.fs.copyTpl(
                    this.templatePath(files[i]),
                    this.destinationPath(files[i]),
                    this.props
                );
            }
            this.fs.copy(
                this.templatePath("gradle/wrapper/gradle-wrapper.jar"),
                this.destinationPath("gradle/wrapper/gradle-wrapper.jar")
            );

            var projects = [
                ["project", [
                    "build.gradle"
                ]]
            ];
            for (var p = 0; p < projects.length; p++) {
                var project = projects[p];
                for (var f = 0; f < project[1].length; f++) {
                    if (project[1][f].indexOf("BINARY-") > -1) {
                        project[1][f] = project[1][f].replace("BINARY-", "");
                        this.fs.copy(
                            this.templatePath("projects/" + project[0] + "/" + project[1][f]),
                            this.destinationPath(this.props.slug + "/" + project[1][f])
                        );
                    } else {
                        this.fs.copyTpl(
                            this.templatePath("projects/" + project[0] + "/" + project[1][f]),
                            this.destinationPath(this.props.slug + "/" + project[1][f]),
                            this.props
                        );
                    }
                }
            }

            var packageDir = this.props.package.replace(/\./g, "/");
            var files = [
                "Util.java"
            ];
            for (var i = 0; i < files.length; i++) {
                this.fs.copyTpl(
                    this.templatePath("projects/java/" + files[i]),
                    this.destinationPath(this.props.slug + "/src/main/java/" + packageDir + "/" + files[i]),
                    this.props
                );
            }
        },

        projectfiles: function () {
            this.fs.copy(
                this.templatePath('gitignore'),
                this.destinationPath('.gitignore')
            );
        }
    },

    install: function () {
        var _this = this;
        this.spawnCommand('git', ['init']).on("close", function() {;
            _this.spawnCommand('git', ['add', '*']).on("close", function() {;
                _this.spawnCommand('git', ['commit', '-am', '\"Initial Commit\"']).on("close", function() {;
                    _this.spawnCommand('git', ['tag', '0.0.0']).on("close", function() {;
                        _this.spawnCommand('./gradlew', ['idea']).on("close", function() {
                        });
                    });
                });
            });
        });
    }
});
