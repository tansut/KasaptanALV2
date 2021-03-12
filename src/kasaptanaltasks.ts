import App from './tasksapp';


console.log('Booting tasks app ...');

App().bootstrap().then(() => console.log('success-taks')).catch((err) => {
    console.log(err);
    process.exit(2);
});