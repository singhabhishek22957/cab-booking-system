


import app from './app.js';





console.log("Port no:",process.env.PORT);



app.listen(process.env.PORT,()=>{
    console.log(` App is running on http://localhost:${process.env.PORT}`);
    
})


