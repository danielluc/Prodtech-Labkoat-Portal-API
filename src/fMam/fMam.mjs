/**
 * Interface to the fMam primarily for updating the Participants
 */

import fetch from 'node-fetch';

import { serviceToken } from '../helpers/serviceToken.mjs';

import config from '../../config.mjs';

import allParticipantsQuery from './queries/allParticipants.mjs';
import getAssetTypeQuery from './queries/assetType.mjs';
import allCharactersQuery from './queries/allCharacters.mjs';
import allNarrativePropsQuery from './queries/allNarrativeProps.mjs';
import allNarrativeScenesQuery from './queries/allNarrativeScenes.mjs';
import allStoryboardsQuery from './queries/getAsset.storyboard.mjs';
import conceptArtQuery from './queries/getAsstet.concept.mjs';
import allShotsQuery from './queries/getAsset.shot.mjs';
import allSlatesQuery from './queries/allSlates.mjs';

const queryOptions = {
    getAssetType: getAssetTypeQuery,
    allParticipants: allParticipantsQuery,
    allCharacters: allCharactersQuery,
    allNarrativeProps: allNarrativePropsQuery,
    allNarrativeScenes: allNarrativeScenesQuery,
    allShots: allShotsQuery,
    allSlates: allSlatesQuery,
    allStoryboards: allStoryboardsQuery,
    conceptArt: conceptArtQuery,
};

const fMamUrl = config.GRAPHQL_URL; // Base Url for the fMam

/**
 * Navigate a path through a set of entities to extract and return all entities at the end of that path
 * @param graphQlQuery {object} - An object containing the query and variables
 * @return {Array}
 */

async function fMamQuery(graphQlQuery, token = null) {
    const bearerToken = token || await serviceToken();
    // console.log(bearerToken);
    console.log(fMamUrl);

    const { responsePath } = graphQlQuery; // Variables to navigate the response
    const qlOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(graphQlQuery),
    };

    let fMamResponse = {};
    try {
        fMamResponse = await fetch(fMamUrl, qlOptions); // POST the graphql query
    } catch (err) {
        console.log('fMam Error');
        console.log(err);
    }

    if (fMamResponse.status === 200) {
        const data = await fMamResponse.json();
        return data !== null ? data.data[responsePath] : [];
        // console.log(`Retrieved ${entities.length} entities from fMam\n`);
        // return entities;
    }
    // No data returned for the query
    console.log(`fMam query failed: ${fMamResponse.statusText} (${fMamResponse.status})\n`);
    return [];
}

/**
 * Execute a query from the fMam for assets of functional or structural type
 * @param queryVariables {object} - Any query variables to be passed to the query
 * @return {Promise<*[]>}
 */
async function getAssetType(queryVariables) {
    const queryName = 'getAssetType';
    const graphQlQuery = queryOptions[queryName]; // Pick one of the graphql queries and variables
    graphQlQuery.variables = { ...queryVariables };
    const type = Object.keys(queryVariables)[0];
    console.log(`Query fMam for ${type}: ${queryVariables[type]}`);
    return fMamQuery(graphQlQuery);
}

/**
 * Execute a query from the fMam using one of the pre-determined query templates
 * @param queryName {string} - The name of the query
 * @param queryVariables {object} - Any query variables to be passed to the query
 * @return {Promise<*[]>}
 */
async function query(queryName, queryVariables = {}, token) {
    const graphQlQuery = queryOptions[queryName]; // Pick one of the graphql queries and variables
    graphQlQuery.variables = { ...queryVariables };
    // console.log(`Query fMam for: ${queryName}`);
    return fMamQuery(graphQlQuery, token);
}

async function mutateOmcPerson(omc) {
    const bearerToken = await fMamToken();
    const queryName = 'mutatePerson';
    const graphQlMutation = queryOptions[queryName]; // Pick one of the graphql queries and variables
    // delete omc.Person.entityType;
    const {
        query,
        responsePath,
    } = graphQlMutation;
    const graphQlBody = {
        query,
        variables: omc,
    };

    const qlOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(graphQlBody),
    };
    let fMamResponse = {};
    try {
        fMamResponse = await fetch(fMamUrl, qlOptions); // POST the graphql query
    } catch (err) {
        console.log(err);
    }

    console.log(fMamResponse);
    let entities = {}; // Process the response
    if (fMamResponse.status === 200) {
        const data = await fMamResponse.json();
        entities = data.data[responsePath]; // Strip relevant data from graphql formatted response
    } else {
        console.log(`Query failed: ${fMamResponse.statusText} (${fMamResponse.status})`);
        return entities;
    }

    const identifier = omc.Person.identifier.filter((id) => id.identifierScope === 'labkoat');
    console.log(`Update the fMam ${identifier[0].identifierValue}`);
    return entities;
}

export {
    query,
    getAssetType,
    mutateOmcPerson,
};
