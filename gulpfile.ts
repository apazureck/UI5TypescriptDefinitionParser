import { Gulpclass, Task, SequenceTask } from 'gulpclass';
import * as gulp from 'gulp';
import * as del from 'del';
import { Parser } from './src/Parser';

@Gulpclass()
export class Gulpfile {

    @Task()
    clean(cb: Function) {
        return del(["out/**/*"], cb);
    }

    @Task()
    copySourceFiles() {
        return gulp.src(["../src/**.json"])
            .pipe(gulp.dest("./src"));
    }


    @SequenceTask()
    default() { // because this task has "default" name it will be run as default gulp task 
        return ["copySourceFiles", "runTest"]
    }

    @Task()
    runTest() {
        let p = new Parser("./src/config.json");
        p.GenerateDeclarations("declarations");
    }
}