// client/src/utils/getLocalizedCategory.js

export const getLocalizedCategory = (categoryItem, language) => {
    let langKey = language;
    if (langKey === 'ua') langKey = 'ua';

    const localizedName = categoryItem.names?.[langKey];
    const oldName = categoryItem.name;

    return {
        key: categoryItem.category,
        label: localizedName || oldName || categoryItem.category || '',
        categoryItem,
    };
};
