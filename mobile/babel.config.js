module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // NOTE: `expo-router/babel` is a plugin that you must add to the plugins array if you use Expo Router.
            'expo-router/babel',
            'react-native-worklets/plugin',
        ],
    };
};
