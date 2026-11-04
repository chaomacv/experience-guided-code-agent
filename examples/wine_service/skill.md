# Classification algorithm migration

Read the current service, task, retrieved diagnostic evidence and fixed interface contract before planning.
Train only on the X,y arguments; classifiers must generalize to new inputs. Keep label/probability alignment through classes_.
Wrap native model outputs in the existing response schema. Implement and preserve both algorithm branches.
Use available sklearn and numpy packages. Return complete replacement file contents through structured write_file actions.
Validation is owned by the application, not the planner. Treat test failures as observations and distinguish interface, runtime, quality and compatibility problems. Do not weaken acceptance criteria to obtain PASS.
