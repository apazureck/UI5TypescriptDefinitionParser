import { Gulpclass, Task, SequenceTask } from "gulpclass";
import * as gulp from "gulp";
import * as del from "gulp-clean";
import { Parser } from "./src/Parser";
import * as fs from "fs";
import * as debug from "gulp-debug";
import * as plumber from "gulp-plumber"

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

  @SequenceTask()
  default() {
    // because this task has "default" name it will be run as default gulp task
    return [
      "deleteDeclarations",
      "copySourceFiles",
      "copyHandlebarsTemplates",
      "replaceFiles",
      "runTest",
      "copyDeclarationsToTestFolder"
    ];
  }
  
  @Task()
  deleteDeclarations() {
      return gulp.src(["declarations", "test/declarations"], { read: false})
      .pipe(del());
  }

  @Task()
  copyDeclarationsToTestFolder() {
    return gulp
      .src("./declarations/**/*")
      .pipe(gulp.dest("../test/declarations"));
      // .pipe(gulp.dest("../../ui5-typescript-example/typings/ui5"));
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
