import App from './app';


console.log('Booting app ...');

App().bootstrap().then(() => console.log('success')).catch((err) => {
    console.log(err);
    process.exit(2);
});
