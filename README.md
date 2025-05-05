# LiveTrac3D - Alpenchallenge

This web-application provides the live tracking of bike riders during a race in 3D, offering functionality to search riders, get live racing updates, follow them on a 3D map and keep a list of your favorite riders and also replay the whole race after it's done. 

The used tech features are ArcGIS, React, mobx, styled components and Vite.


## Get it running

1. Clone the repository:
   ```bash
   git clone https://github.com/dlaumer/alpenchallenge.git
   cd alpenchallenge

2. Install the dependencies
    ```bash
    npm install
    ```

3. Start the development server and open your browser at http://localhost:5173:

    ```bash
    npm run dev
    ```

## Production Build
Build and preview the production bundle:

    ```bash
    npm run build
    npm run serve
    ```

## Project Structure

├── public/          Static assets
├── src/             Source code
│   ├── main.jsx     Entry point
│   ├── App.jsx      Root component
│   ├── components/  UI and map components
│   ├── store/       MobX stores
│   ├── utils/       Helper functions
│   └── assets/      Images and models
├── vite.config.js   Vite configuration
└── package.json     Dependencies and scripts


Copyright © 2025 Dnaiel Laumer

All rights reserved. This software and associated documentation files are proprietary and confidential.  
No part of the Software may be reproduced, distributed, or transmitted in any form or by any means, without the prior written permission of the copyright holder.
