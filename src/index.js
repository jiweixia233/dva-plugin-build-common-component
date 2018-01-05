import React from 'react';
import invariant from 'invariant';
import {setCache, getCache} from "./cache";
import {proxyStateForUI, proxyReducer} from "./proxy";
import wrappedCallbacks from './mapDispatchToProps';

export default function (app, connect) {

    return {
        $model,
        $connect
    };

    function $connect(getUIState, callbacks, ...connectArgs) {
        return UI => {
            class ComponentWithPrefix extends React.Component {
                render() {
                    const prefix = this.props.prefix;
                    const cachePath = [getUIState, UI, callbacks, JSON.stringify(prefix)];
                    let Component = getCache(cachePath);

                    if (Component) {
                        return <Component {...this.props} />;
                    }

                    const mapDispatchToProps = wrappedCallbacks(app, callbacks, prefix);

                    const mapStateToProps = (...args) => {
                        const [state, ...extArgs] = args;
                        return getUIState(proxyStateForUI(state, prefix), ...extArgs);
                    };
                    Component = connect(mapStateToProps, mapDispatchToProps, ...connectArgs)(UI);
                    setCache(cachePath, Component);

                    return <Component {...this.props} />;
                }
            }

            return ComponentWithPrefix;
        }
    }

    function $model(m) {
        invariant(
            m.prefix,
            'dva->$model: prefix should be defined'
        );
        const modelState = {...m.state};

        m.state = m.prefix.reduce((ret, key) => {
            ret[key] = modelState;
            return ret;
        }, {});

        // reducers
        m.reducers = proxyReducer(m.reducers);

        console.log(m);
        app.model(m);
    }
}


