function displaySidebar() {
    var sidebarElement = document.getElementsByClassName("Sidebar")[0];

    if (sidebarElement) {
        sidebarElement.innerHTML = `
            <div class="sidebar-content">
                <nav>
                    <ul>
                        <li><a href="/VLSM">
                              <div class="span3">
                                <i class="demo-icon icon-sort-numeric-outline" title="VLSM">&#xe800;</i> <span class="i-name"></span><span class="i-code"></span>
                                </div>
                            </a>
                        </a></li>
                        <li><a href="/"><div class="span3"">
                            <i class="demo-icon icon-home-circled" title="Home">&#xe801;</i> <span class="i-name"></span><span class="i-code"></span>
                            </div>
                            </a>
                        </li>
                        <li>
                            <a href="/IP">
                                <div class="span3"">
                                    <i class="demo-icon icon-calc" title="IP">&#xf1ec;</i> <span class="i-name"></span><span class="i-code"></span>
                                </div>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        `;
    } else {
        console.error("Element with class 'Sidebar' not found");
    }
}

displaySidebar();
