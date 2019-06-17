import {createStore, applyMiddleware, compose} from 'redux';
import {createLogger} from 'redux-logger';
import rootReducer from './reducers';

const loggerMiddleware = createLogger();
const middleware = []

const composeEnhancers = window._REDUX_DEVTOOLS_EXTENSION_COMPOSE_ || compose   

//import React from 'react'

export default function configureStore(preloadedState) {
    return createStore(rootReducer, 
        preloadedState,
        composeEnhancers(applyMiddleware(...middleware, loggerMiddleware))
    )
}
