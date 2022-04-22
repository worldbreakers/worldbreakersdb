export function route(name, options) {
    return window.encodeURI(window.Routing.generate(name, options));
}

export function cardImageURL() {
    return window.WBDB.card_image_url;
}
