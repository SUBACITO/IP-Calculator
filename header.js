function displaySidebar() {
    var sidebarElement = document.getElementsByClassName("Sidebar")[0];

    if (sidebarElement) {
        sidebarElement.innerHTML = `
            <div class="sidebar-content">
                <nav>
                    <ul>
                        <li><a href="../VLSM/index.html">VLSM</a></li>
                        <li><a href="../IP/index.html">IP</a></li>
                    </ul>
                </nav>
            </div>
        `;
    } else {
        console.error("Element with class 'Sidebar' not found");
    }
}

displaySidebar();
