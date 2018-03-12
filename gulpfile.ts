import { Gulpclass, Task, SequenceTask } from "gulpclass";
import * as gulp from "gulp";
import * as del from "gulp-clean";
import { Parser } from "./src/Parser";
import * as fs from "fs";
import * as debug from "gulp-debug";
import * as plumber from "gulp-plumber";
import * as path from 'path';
import * as gutil from 'gulp-util'

@Gulpclass()
export class Gulpfile {

  @Task()
  copySourceFiles() {
    return gulp.src(["../src/**.json"]).pipe(gulp.dest(""));
  }

  @Task()
  copyHandlebarsTemplates() {
    return gulp.src(["../src/templates/**.hb"]).pipe(gulp.dest("templates"));
  }

  @Task()
  getGlobalModules() {
    const modules: string[] = [];
    this.getModules("declarations/modules", "sap/ui/Global/ui.d.ts", modules);
    gutil.log(modules);
  }

  private getModules(basedir: string, file: string, modules: string[]): void {
    const text = fs.readFileSync(path.join(basedir, file), "utf-8");
    const regex = /import \w+ from "([\w\/]+)";/g
    let match: RegExpMatchArray;
    while (match = regex.exec(text)) {
      const modulename = match[1]
      if (!modules.some(x => x === modulename)) {
        modules.push(modulename);
        this.getModules(basedir, modulename + ".d.ts", modules);
      }
    }
  }

  @SequenceTask()
  default() {
    // because this task has "default" name it will be run as default gulp task
    return [
      "deleteDeclarations",
      "copySourceFiles",
      "copyHandlebarsTemplates",
      "replaceFiles",
      "runTest",
      [
        "copyDeclarationsToTestFolder",
        // "copyDeclarationsToExampleProject"
      ]
    ];
  }

  @Task()
  deleteDeclarations() {
    return gulp.src(["declarations", "test/declarations"], { read: false })
      .pipe(del());
  }

  @Task()
  copyDeclarationsToTestFolder() {
    return gulp
      .src("./declarations/**/*")
      .pipe(gulp.dest("../test/declarations"));
  }

  @Task()
  copyDeclarationsToExampleProject() {
    return gulp
      .src("./declarations/**/*")
      .pipe(gulp.dest("../../ui5-typescript-example/typings/ui5"));
  }

  @Task()
  runTest() {
    let p = new Parser("./config.json");
    return p.GenerateDeclarations();
  }

  @Task()
  replaceFiles() {
    console.log("Copying replacement files");
    return gulp
      .src(["../src/replacements/**/*"])
      .pipe(gulp.dest("replacements"));
  }
}
