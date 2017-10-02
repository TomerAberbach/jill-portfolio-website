function fix() {
    if (window.innerWidth > 1280) {
        var nav = document.getElementsByTagName("NAV")[0];
        if (nav.hasAttribute('class')) {
            nav.removeAttribute('class');
        }
        var lis = nav.getElementsByTagName("LI");
        for (var i = 0; i < lis.length; i++) {
            if (lis[i].hasAttribute('class')) {
                lis[i].removeAttribute('class');
            }
        }
    }

    return window.innerWidth > 1280;
}

function toggleSections() {
    if (!fix()) {
        var nav = document.getElementsByTagName("NAV")[0];
        if (nav.hasAttribute('class')) {
            nav.removeAttribute('class');
        } else {
            nav.setAttribute('class', 'opennav');
        }
        var lis = nav.getElementsByTagName("LI");
        for (var i = 0; i < lis.length; i++) {
            if (lis[i].hasAttribute('class')) {
                lis[i].removeAttribute('class');
            } else {
                lis[i].setAttribute('class', 'openli');
            }
        }
    }

    return true;
}
