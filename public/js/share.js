// Creates and opens window for twitter sharing
function tweet_current_page() {
    var link = get_link();
    window.open("https://twitter.com/share?url="+escape(link)+"&text="+"Check out this petition map"+"&hashtags="+"petitionmap", '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
    return false;
}

// Creates and opens window for facebook sharing
function facebook_current_page() {
    var link = get_link();
    window.open("https://www.facebook.com/sharer/sharer.php?u="+escape(link)+"&t="+"Petition Map (By Unboxed)", '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
    return false;
}
