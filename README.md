[![CI/CD](https://github.com/geocortex/workflow-activities-utility-network/workflows/CI/CD/badge.svg)](https://github.com/geocortex/workflow-activities-utility-network/actions)
[![npm](https://img.shields.io/npm/v/@geocortex/workflow-activities-utility-network)](https://www.npmjs.com/package/@geocortex/workflow-activities-utility-network)

This project contains activities for interacting with the [ArcGIS Utility Network REST API](https://developers.arcgis.com/rest/services-reference/utility-network-service.htm) in a [Geocortex Workflow](https://www.geocortex.com/products/geocortex-workflow/).

## Requirements

### Geocortex Workflow Versions

The Utility Network activities are designed to work with Geocortex Workflow versions `5.20` and above.

## Usage
To use the Utility Network activities in [Geocortex Workflow Designer](https://apps.geocortex.com/workflow/designer/) you need to register an activity pack and then add the activities to a workflow.

### Register the Utility Network activity pack

1. Sign in to ArcGIS Online or Portal for ArcGIS
1. Go to **My Content**
1. Select **Add Item > An application**
    - Type: `Web Mapping`
    - Purpose: `Ready To Use`
    - API: `JavaScript`
    - URL: The URL to this activity pack manifest
        - Use https://unpkg.com/@geocortex/workflow-activities-utility-network/activitypack.json for the latest version
        - Use https://unpkg.com/@geocortex/workflow-activities-utility-network@0.1.0/activitypack.json for a specific version
    - Title: Your desired title
    - Tags: Must include `geocortex-workflow-activity-pack`
1. Reload [Geocortex Workflow Designer](https://apps.geocortex.com/workflow/designer/)
1. The Utility Network activities will now appear in the activity toolbox in an `Utility Network` category

## Development

This project was bootstrapped with the [Geocortex Workflow SDK](https://github.com/geocortex/vertigis-workflow-sdk). Before you can use your activity pack in the [Geocortex Workflow Designer](https://apps.geocortex.com/workflow/designer/), you will need to [register the activity pack](https://developers.geocortex.com/docs/workflow/sdk-web-overview#register-the-activity-pack).

## Available Scripts

Inside the newly created project, you can run some built-in commands:

### `npm run generate`

Interactively generate a new activity or form element.

### `npm start`

Runs the project in development mode. Your activity pack will be available at [http://localhost:5000/main.js](http://localhost:5000/main.js). The HTTPS certificate of the development server is a self-signed certificate that web browsers will warn about. To work around this open [`https://localhost:5000/main.js`](https://localhost:5000/main.js) in a web browser and allow the invalid certificate as an exception. For creating a locally-trusted HTTPS certificate see the [Configuring a HTTPS Certificate](https://developers.geocortex.com/docs/workflow/sdk-web-overview/#configuring-a-https-certificate) section on the [Geocortex Developer Center](https://developers.geocortex.com/docs/workflow/overview/).

### `npm run lint`

Runs linter to perform static analysis.

### `npm run build`

Builds the activity pack for production to the `build` folder. It optimizes the build for the best performance.

Your custom activity pack is now ready to be deployed!

See the [section about deployment](https://developers.geocortex.com/docs/workflow/sdk-web-overview/#deployment) in the [Geocortex Developer Center](https://developers.geocortex.com/docs/workflow/overview/) for more information.

## Documentation

Find [further documentation on the SDK](https://developers.geocortex.com/docs/workflow/sdk-web-overview/) on the [Geocortex Developer Center](https://developers.geocortex.com/docs/workflow/overview/)
