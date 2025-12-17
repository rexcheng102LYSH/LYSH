// ================= 视觉特效资源与引擎 (Visual Effects) =================

/**
 * [Alpha 0.7.7.5] Asset Update: Voodoo Icon & Sun
 * - Voodoo: Updated to User Provided Green Potion SVG.
 * - Sun: High-Fidelity multi-path SVG.
 * - Maple: FontAwesome Standard.
 */

// 1. 棋子皮肤库
const PIECE_ICONS = {
    // 🍁 落叶：Iconfont Source (Cleaned & Optimized)
    maple: `
        <svg viewBox="0 0 1024 1024" fill="none" class="piece-svg maple-piece">
            <path d="M953.911 598.923c0.402 4.506-11.779 9.646-30.88 13.899 0.986 0.708 1.558 1.494 1.658 2.353 0.672 5.604-18.254 12.728-45.772 18.073 8.977 3.176 14.087 6.482 13.781 9.428-0.356 3.38-7.744 5.721-19.699 6.861-1.864 2.112-6.118 4.261-12.214 6.313-1.008 4.412-13.557 9.216-32.413 13.048 7.321 4.312 13.081 8.325 16.734 11.73 5.75 2.645 8.896 5.266 8.608 7.597-0.738 6.015-23.81 8.357-55.037 6.303 0.126 0.6 0.093 1.134-0.109 1.627-0.873 2.201-4.926 2.976-11.346 2.479 0.675 1.256 0.857 2.341 0.509 3.236-1.644 4.064-14.111 3.26-32.104-1.31 10.445 12.335 17.301 22.66 18.817 28.618 6.318 6.501 9.314 11.494 7.782 13.965-2.844 4.576-20.548-0.91-43.798-12.74 0.876 3.006 0.733 5.396-0.56 6.923-4.44 5.201-20.803-1.322-37.883-14.694 0.883 4.229 0.476 7.385-1.441 8.958-4.355 3.563-15.252-2.135-27.04-13.296-0.23 0.774-0.599 1.434-1.118 1.952-4.003 4.123-15.864-0.57-29.137-10.754-5.764 3.081-20.642-4.422-35.749-17.928-4.469 1.428-8.849 2.599-13.012 3.491-2.502 2.689-5.166 4.622-7.89 5.632-1.047 4.393-2.779 7.993-5.126 10.477 2.736 6.207 5.664 13.526 8.498 21.451 1.568 4.414 3.005 8.7 4.295 12.76 3.805 7.444 8.416 18.271 12.788 30.546a341.925 341.925 0 0 1 5.719 17.418c4.042 6.395 8.66 14.496 13.241 23.478a546.523 546.523 0 0 1 2.893 5.77c5.1 6.191 12.846 18.804 20.528 33.856 0.668 1.3 1.324 2.594 1.953 3.863 4.546 6.332 10.431 16.102 16.356 27.481 3.406 3.922 7.552 10.315 11.41 17.858a126.364 126.364 0 0 1 4.023 8.611 130.69 130.69 0 0 1 4.789 6.371c3.014 4.276 5.551 8.406 7.388 11.897a104.809 104.809 0 0 1 8.489 10.36c2.737 0.013 6.195 0.985 9.615 2.871 6.314 3.506 10.05 8.854 8.352 11.931a2.14 2.14 0 0 0-0.111 0.183c-0.046 0.862-0.26 1.684-0.67 2.419-2.189 3.954-9.103 4.324-15.427 0.822-3.772-2.111-6.495-5.125-7.591-8.062-1.921-2.019-3.883-4.309-5.83-6.779-3.552-4.527-6.475-8.977-8.503-12.755-4.056-2.042-14.369-17.739-24.594-37.739-0.669-1.3-1.315-2.596-1.936-3.879-4.938-6.839-11.385-17.71-17.81-30.285a498.477 498.477 0 0 1-2.883-5.731c-5.097-6.18-12.851-18.812-20.563-33.897-0.555-1.104-1.116-2.196-1.655-3.286-4.181-5.262-11.276-20.478-17.869-38.952a371.733 371.733 0 0 1-4.292-12.75c-3.82-7.429-8.416-18.271-12.81-30.55a327.765 327.765 0 0 1-5.28-16.014c-1.509 0.001-3.268-0.665-5.147-1.921a2.68 2.68 0 0 1-0.482 0.099c-2.835 0.383-5.84-2.155-8.688-6.808-3.587-0.01-7.593-0.287-11.874-0.846-5.702 2.37-12.334 4.517-19.517 6.239-5.948 19.379-14.78 33.487-21.302 33.84-6.107 15.582-13.819 25.736-19.374 24.288-0.718-0.184-1.369-0.557-1.957-1.096-4.315 15.651-10.698 26.165-16.269 25.372-2.439-0.359-4.422-2.851-5.861-6.916-7.698 20.281-18.319 34.331-24.788 32.173-1.926-0.634-3.269-2.613-4.085-5.627-13.768 22.148-26.081 36.015-30.88 33.565-2.591-1.316-2.611-7.146-0.564-15.98-1.778-5.887-1.269-18.263 1.285-34.222-13.028 13.22-23.273 20.363-26.788 17.732-0.768-0.578-1.173-1.604-1.231-3.031-5.242 3.745-9.118 5.188-11.02 3.76-0.416-0.32-0.711-0.763-0.921-1.335-25.645 17.908-46.604 27.847-50.354 23.089-1.458-1.849-0.12-5.715 3.447-10.957 1.358-4.806 4.206-11.217 8.235-18.701-18.121 6.483-31.351 8.871-34.475 5.615-6.29 1.4-11.037 1.764-13.732 0.92-10.806 5.213-18.355 7.039-20.408 4.328-1.787-2.364 0.88-7.841 6.919-15.198-26.305 9.661-46.196 13.365-48.516 8.224-0.362-0.788-0.277-1.757 0.184-2.864-18.512 6.238-31.61 8.145-33.584 4.078-1.273-2.631 2.301-7.384 9.421-13.298-0.792-0.591-1.245-1.266-1.37-2.002-0.524-3.085 4.988-6.935 14.658-10.892 0.54-0.419 1.101-0.836 1.678-1.269 0.129-2.701 3.463-6.751 9.254-11.621-0.573-0.522-0.929-1.092-1.031-1.72-0.558-3.294 5.711-7.435 16.557-11.653 2.486-3.239 9.819-6.999 20.455-10.713-4.944-0.937-7.873-2.431-8.218-4.471-0.537-3.258 5.625-7.375 16.324-11.559 6.336-5.606 17.408-10.912 31.434-15.109 3.869-3.409 9.516-6.727 16.518-9.732 3.348-4.642 7.662-9.573 12.795-14.636-6.154-1.858-10.879-4.268-13.745-7.133-11.183-2.024-19.547-5.382-23.626-9.785-3.712-0.778-7.091-1.701-10.044-2.769-15.359 2.382-26.532 0.627-29.635-5.811-1.48-3.058-1.003-6.896 1.137-11.21-16.173 5.172-27.929 5.81-30.861 0.69-0.921-1.607-0.901-3.688-0.071-6.128-19.77-2.912-32.632-7.188-32.502-11.63a1.95 1.95 0 0 1 0.12-0.655c-2.215-0.953-3.864-1.936-4.873-2.95-9.969-1.493-15.971-3.828-16.187-6.799-0.217-3.107 5.939-6.404 16.398-9.381 0.417-2.048 3.64-3.905 9.04-5.468 4.536-7.139 13.923-16.057 26.553-25.223-11.754-6.06-20.993-12.285-26.509-17.864-7.091-0.392-11.791-2.223-13.118-5.631-0.708-1.791-0.437-3.908 0.716-6.249-5.2-1.989-9.218-3.949-11.765-5.793-4.881-0.297-7.878-1.34-8.404-3.188-0.469-1.635 1.01-3.741 4.107-6.167 2.887-4.202 8.978-9.953 17.394-16.514-26.338-19.257-43.57-36.605-40.331-41.494 1.119-1.681 4.504-1.712 9.593-0.349-15.797-15.135-24.771-27.144-22.012-30.689 0.93-1.182 3.084-1.331 6.235-0.567-31.632-25.104-53.853-48.613-50.196-53.309 2.706-3.476 18.869 4.285 40.097 18.497 7.092 0.161 20.217 5.078 36.086 13.412-4.679-5.819-6.746-9.982-5.424-11.684 1.916-2.453 10.517 0.694 22.896 7.75 3.249-2.545 11.269-1.491 22.148 2.41-7.256-8.093-10.805-13.951-9.169-16.055 3.114-3.981 23.898 6.798 49.718 25.138 5.186-1.308 15.219 1.192 27.898 6.657-2.612-14.051-2.336-24.059 1.315-26.992-0.241-1.842 0.03-3.185 0.87-3.918 2.73-2.395 10.888 1.949 21.888 10.894 5.606-4.12 31.165 16.502 58.109 46.78A399.813 399.813 0 0 1 360.022 489c8.178-1.153 17.083-2.125 26.447-2.842-3.446-10.113-7.076-21.991-10.568-34.834-6.871-9.376-14.542-20.609-22.309-32.881-6.769-10.687-12.861-20.957-17.979-30.189-5.248-5.022-12.085-14.022-18.808-25.101-16.041-15.981-25.604-28.037-23.484-30.47 0.963-1.108 4.234-0.098 9.209 2.611-2.087-5.163-3.521-9.649-4.158-13.096-10.922-11.641-16.924-19.98-15.198-21.965 0.986-1.136 4.388-0.041 9.601 2.824-6.733-13.758-11.297-24.935-12.784-31.364-4.48-6.625-6.472-11.052-5.203-12.287 1.201-1.151 5.093 0.639 10.883 4.717 7.316-0.192 19.638 1.047 34.751 3.509 7.515-0.663 17.207 0.445 28.15 3.174-12.73-34.514-18.584-62.418-13.142-64.581 0.028-0.009 0.057-0.018 0.083-0.037-4.127-17.957-4.913-30.189-1.351-31.46 2.121-0.757 5.474 2.427 9.565 8.576a9.47 9.47 0 0 1 2.208-2.053c5.147-3.443 13.321-1.493 22.826 4.577-8.637-28.459-11.415-50.043-5.961-52.074 2.878-1.078 7.584 3.485 13.198 12.019-3.713-19.951-4.29-32.752-0.826-33.835 1.442-0.451 3.458 1.171 5.947 4.542-0.133-16.24 1.409-27.996 4.634-32.965-1.083-8.923-0.84-14.448 0.925-15.471 0.359-2.47 1.014-3.89 1.996-4.134 2.044-0.503 5.205 4.146 9.083 12.729 5.332 2.576 12.735 11.839 21.029 25.8 0.384-4.164 1.268-6.599 2.745-6.967 3.504-0.854 9.642 10.397 16.795 29.387 0.381-10.209 2.056-16.547 5.075-17.114 5.725-1.088 14.507 18.818 21.852 47.639 4.992-10.11 10.971-16.014 17.168-15.73 1 0.043 1.985 0.249 2.937 0.611 0.312-7.38 1.537-11.838 3.744-12.287 3.714-0.753 9.366 10.116 15.142 27.62 0.023 0.003 0.051-0.006 0.08-0.015 5.775-0.967 15.226 25.938 22.182 62.059 7.956-7.999 15.687-13.968 22.444-17.286 11.669-9.925 21.55-17.362 27.928-20.991 2.835-6.481 5.235-10.029 6.857-9.667 1.729 0.402 2.315 5.227 1.92 13.209 2.056 6.272 3.93 18.196 5.296 33.454 2.957-5.147 5.32-7.846 6.74-7.388 2.506 0.809 1.694 11.047-1.627 26.661 1.246 3.277 2.343 7.858 3.213 13.359 2.86-4.897 5.141-7.454 6.539-7 3.066 0.99 1.123 16.255-4.319 38.221-0.044 12.963-1.213 24.205-3.115 31.223 0.404 10.539 0.514 22.481 0.247 35.137-0.299 14.521-1.033 28.088-2.071 39.676 3.676 12.796 6.718 24.837 8.995 35.273 8.378-4.233 16.502-8.01 24.089-11.252 3.549-5.845 7.067-11.346 10.495-16.399 7.392-39.862 18.578-70.728 25.521-70.111 4.774-13.343 9.503-21.276 13.073-20.643 1.098 0.191 2.031 1.199 2.774 2.904 4.654 0.609 10.076 9.035 15.097 22.417 8.021-11.247 15.323-18.58 20.431-20.146 12.603-29.055 24.805-49.037 29.528-47.235 2.487 0.952 2.488 7.793 0.467 18.483 7.295-8.976 13.594-14.026 17.709-13.531 6.913-12.44 12.659-19.591 15.565-18.478 2.013 0.774 2.4 5.399 1.424 12.798 9.263-15.343 17.936-26.343 23.921-30.153 10.808-23.14 20.615-38.15 24.731-36.577 5.578 2.122-1.288 33.742-15.354 71.595 2.305-2.282 4.227-3.271 5.627-2.745 4.203 1.609 2.729 16.529-2.955 37.658 3.66-3.806 6.568-5.532 8.391-4.667 5.306 2.5-0.455 26.262-13.03 56.378 10.598 1.254 18.789 3.02 23.426 5.122 3.91 0.475 6.268 1.508 6.708 3.152 0.515 1.851-1.508 4.295-5.532 7.073-1.229 2.899-3.641 6.649-7.063 11.051 2.188 1.401 3.519 3.081 3.838 4.972 0.615 3.611-2.441 7.604-8.305 11.607-1.835 7.636-6.521 17.745-13.444 29.014 15.548 1.3 28.201 4.07 35.787 7.827 5.413-1.452 9.14-1.528 10.555 0.011 10.489-2.872 17.469-3.241 18.881-0.467 1.373 2.651-2.57 7.762-10.313 14.196-0.33 1.392-1.256 3.084-2.652 5.051 0.186 0.131 0.315 0.311 0.437 0.493 2.415 3.739-6.378 14.053-21.794 26.774 1.996 1.659 3.083 3.426 3.127 5.277 0.128 5.9-10.252 11.441-26.766 15.389 4.066 2.584 6.46 5.618 6.773 8.999 0.683 7.109-7.974 14.406-22.346 20.314-1.98 2.443-4.376 4.974-7.169 7.564-1.221 5.883-6.628 13.084-15.143 20.598-0.979 3.942-3.771 8.451-8.082 13.225 7.018 1.672 13.267 3.657 18.534 5.897 7.55-1.051 14.073-1.132 19.177-0.224 14.163-3.663 26.375-4.852 34.715-3.343 11.302-1.951 18.72-1.62 19.939 1.445 0.759 1.922-0.967 4.714-4.715 8.076 11.02-2.325 19.231-2.901 23.036-1.42 11.466-2.003 18.988-1.704 20.201 1.405 0.244 0.584 0.235 1.257-0.004 2.003 7.49 1.167 12.445 2.908 13.954 5.15 0.723 0.066 1.404 0.137 2.093 0.226 10.325-1.625 17.031-1.187 18.183 1.723 0.272 0.7 0.23 1.51-0.134 2.419 9.159 1.381 14.662 3.6 14.952 6.505z" fill="#f61906"></path>
        </svg>
    `,
    
    // ☀️ 生辉 (Nature) - High-Fidelity SVG
    sun: `
        <svg viewBox="0 0 1024 1024" fill="none" class="piece-svg sun-piece">
            <path d="M511.31157 791.328598c-61.645135 0.706892-105.13978-15.680526-131.540114-32.650091-62.11501 62.235598-147.095896 79.205162-256.12774 84.506852 100.424395 134.492428 337.927611 68.015479 387.667854-51.856761zM593.464888 779.066102c0.120587 87.929041-47.973013 160.065284-121.402453 241.041834 166.078023 23.930371 287.12703-190.948145 237.507374-310.932655-43.141199 44.08095-85.454919 63.295936-116.104921 69.890821zM791.714811 510.9212c0.71105 61.765722-15.676368 105.256209-32.650091 131.540115 62.235598 62.11501 79.092891 147.100054 84.51101 256.244168 134.375999-100.544982 68.015479-337.927611-51.860919-387.784283zM709.569809 312.667119c44.08095 43.141199 63.291777 85.571348 69.89498 116.096605 87.929041 0 159.944696 48.089443 240.921247 121.406611 24.042642-166.078023-190.831716-287.010601-310.816227-237.503216zM511.31157 230.630231c61.645135-0.706892 105.256209 15.676368 131.540115 32.650091 62.119168-62.235598 147.104212-79.209321 256.12774-84.51101-100.424395-134.48827-337.811182-68.011321-387.667855 51.860919zM429.158253 242.888568c-0.120587-88.049628 48.089443-160.065284 121.402453-241.041834-166.073865-23.926213-287.006443 190.827557-237.503216 310.820385 43.141199-43.96452 85.454919-63.295936 116.100763-69.778551zM230.904172 510.9212c-0.590463-61.645135 15.676368-105.13978 32.76652-131.423686C201.318665 317.382504 184.461372 232.39746 179.043253 123.253345c-134.371841 100.424395-68.011321 337.927611 51.860919 387.667855zM313.05749 709.175281c-44.085108-43.02477-63.295936-85.454919-69.89498-115.984334-87.929041 0-159.948854-48.089443-240.921247-121.402453-24.0468 166.073865 190.827557 287.006443 310.816227 237.386787zM561.268039 703.757162l-0.361762 0.074847 0.361762-0.074847zM354.427301 623.720362l1.413783-10.965142c135.806416 80.514992 246.114823 3.530301 289.705107-72.780762-22.100768 18.304343-50.879587 29.402546-82.382018 29.402547-69.649647 0-126.117838-54.143764-126.117838-120.932578 0-6.441033 0.536406-12.75732 1.551004-18.923913-5.650977-73.574976 51.270456-140.309733 131.46111-128.504638a207.081914 207.081914 0 0 0-50.62178-6.270547c-114.113149 0-206.620355 92.507205-206.620354 206.620355 0 93.966729 62.751213 173.238423 148.62195 198.312296-39.694061-11.925683-77.175967-36.725115-107.010964-75.957618zM572.798694 701.004441c-0.785898 0.212068-1.575953 0.432452-2.36185 0.636203 0.790056-0.199593 1.571795-0.424135 2.36185-0.636203zM468.028993 701.545006c-1.214191-0.32018-2.424224-0.677785-3.634256-1.018756 1.218349 0.332655 2.411749 0.706892 3.634256 1.018756zM592.882742 694.51351c-1.384677 0.523932-2.769353 1.047863-4.162346 1.542688 1.397151-0.498983 2.781828-1.018756 4.162346-1.542688zM609.885572 687.182625l-1.941874 0.927276 1.941874-0.927276zM601.540089 691.004zM582.096402 698.297461c-1.176767 0.378395-2.366009 0.723525-3.551092 1.076971 1.189242-0.357604 2.374325-0.702734 3.551092-1.076971z" fill="#FBD00A"></path><path d="M563.172489 569.381163c31.498273 0 60.277091-11.098203 82.382018-29.402546 2.033354-3.559409 3.929488-7.122976 5.671769-10.665752 70.601872-254.007064-270.864357-185.288851-163.250456-2.711139-31.581437-29.360964-46.825354-63.907189-49.370164-97.072895a116.919926 116.919926 0 0 0-1.551004 18.923912c0 66.784655 56.464033 120.928419 126.117837 120.92842z" fill="#FDE778"></path><path d="M572.362085 301.35269c-0.773423-0.128904-1.530213-0.216226-2.299478-0.332655-80.190653-11.805095-137.112087 54.925503-131.46111 128.504637 2.544811 33.165706 17.788728 67.711931 49.370165 97.072896-107.613902-182.577713 233.848169-251.295925 163.250455 2.711138a193.717498 193.717498 0 0 1-5.671768 10.665752c-43.590283 76.311064-153.898691 153.295754-289.705106 72.780762l-1.413784 10.965142c29.83084 39.232502 67.316903 64.031935 107.015123 75.965934 0.981332 0.295231 1.970981 0.561355 2.952313 0.839954 1.210033 0.340971 2.420065 0.698576 3.634256 1.018756 30.650003 8.071043 62.422716 8.586658 92.873126 2.287003l0.361762-0.074847a204.56621 204.56621 0 0 0 9.168805-2.116518c0.785898-0.203751 1.575953-0.428293 2.36185-0.636203 1.921083-0.515615 3.838007-1.060338 5.746616-1.634167 1.185084-0.353446 2.374325-0.698576 3.551092-1.076971 2.220472-0.706892 4.424312-1.459524 6.623994-2.237105 1.392993-0.494824 2.777669-1.018756 4.162346-1.542688a255.275311 255.275311 0 0 0 8.657347-3.513669 205.27726 205.27726 0 0 0 8.345483-3.821374c41.403077-20.042465 77.022114-53.944171 99.089617-99.530385 57.990088-128.941247-22.749446-258.364845-136.613104-286.295392z" fill="#FFE15E"></path>
        </svg>
    `,

    // ⚫ 经典黑子 (UI)
    classic_black: `
        <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" fill="#111" stroke="#000" stroke-width="2"/>
            <circle cx="35" cy="35" r="10" fill="#fff" fill-opacity="0.2"/>
        </svg>
    `,

    // ⚪ 经典白子 (UI)
    classic_white: `
        <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" fill="#fff" stroke="#999" stroke-width="3"/>
        </svg>
    `
};

// 2. 技能图标库 (voodoo updated to user spec)
const SKILL_ICONS = {
    double: '<svg viewBox="0 0 64 64" fill="none"><circle cx="24" cy="24" r="14" fill="#E0E0E0" stroke="currentColor" stroke-width="3"/><circle cx="40" cy="40" r="14" fill="currentColor" stroke="white" stroke-width="3"/><path d="M48 20 L56 12 M52 24 L58 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    
    // 🟢 巫毒 (Voodoo) - User Provided Green Potion
    voodoo: '<svg viewBox="0 0 1024 1024" fill="none"><path d="M672.576 0c14.784 0 26.7648 12.0704 26.7648 26.944v107.7888a26.8544 26.8544 0 0 1-26.752 26.9568h-53.5296v107.776C722.5216 269.4784 806.4 353.9456 806.4 458.112v485.056C806.4 987.8016 770.4576 1024 726.1056 1024H297.8944C253.5424 1024 217.6 987.8016 217.6 943.1552V458.112c0-104.1664 83.8784-188.6208 187.3408-188.6208v-107.7888h-53.5168a26.8544 26.8544 0 0 1-26.7648-26.9568v-107.776C324.6592 12.0576 336.64 0 351.4112 0h321.1648z m-84.864 560.32l-37.8624 38.1056 18.944 19.072L512 674.6496l-56.7808-57.1648 18.9312-19.0592-37.8496-38.1056-75.6992 76.224 37.8496 38.1056 18.9184-19.0464 56.7808 57.1648-56.768 57.152-18.9312-19.072-37.8496 38.1184 75.6992 76.2112 37.8496-38.1056-18.9184-19.0464L512 750.8864l56.768 57.1648-18.9184 19.0592 37.8496 38.1056 75.6992-76.224-37.8496-38.1056-18.9184 19.0592-56.7808-57.1648 56.7808-57.1776 18.9184 19.0464 37.8496-38.1184-75.6992-76.2112z m-22.1824-398.6304h-107.0592v134.7328a26.8544 26.8544 0 0 1-26.752 26.944h-26.7776c-64.7424 0-118.7328 46.2976-131.136 107.7888h476.3904c-12.4032-61.4912-66.3936-107.776-131.136-107.776h-26.7648a26.8544 26.8544 0 0 1-26.7648-26.9568V161.6896z" fill="#1AB370"></path></svg>',
    
    move_self: '<svg viewBox="0 0 64 64" fill="none"><circle cx="20" cy="32" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/><path d="M32 32 L46 32" stroke="currentColor" stroke-width="3" marker-end="url(#arrow)"/><circle cx="50" cy="32" r="10" fill="currentColor"/><path d="M44 26 L50 32 L44 38" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    move_enemy: '<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="42" r="10" stroke="currentColor" stroke-width="3"/><path d="M16 10 L24 28 M48 10 L40 28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M20 28 Q32 36 44 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    zone: '<svg viewBox="0 0 64 64" fill="none"><rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" stroke-width="3"/><path d="M25 12 V52 M39 12 V52 M12 25 H52 M12 39 H52" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.5"/><rect x="26" y="26" width="12" height="12" fill="currentColor"/></svg>',
    bomb: '<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="38" r="16" fill="currentColor"/><path d="M32 22 V14 M32 14 Q42 14 46 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M46 16 L50 12 M50 20 L54 22 M44 10 L46 6" stroke="#ff5252" stroke-width="2"/></svg>',
    god_hand: '<svg viewBox="0 0 64 64" fill="none"><path d="M32 54 V40 M20 30 Q20 10 32 10 Q44 10 44 30" stroke="currentColor" stroke-width="3"/><path d="M20 30 L20 40 Q20 46 26 46 H38 Q44 46 44 40 L44 30" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="24" r="4" fill="currentColor"/></svg>',
    chaos: '<svg viewBox="0 0 64 64" fill="none"><path d="M32 6 L56 18 V46 L32 58 L8 46 V18 Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1"/><path d="M32 6 V30 M56 18 L32 30 L8 18" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="18" r="2" fill="currentColor"/><circle cx="20" cy="36" r="2" fill="currentColor"/><circle cx="44" cy="36" r="2" fill="currentColor"/></svg>',
    short_battle: '<svg viewBox="0 0 64 64" fill="none"><path d="M12 52 L52 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M12 12 L52 52" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M10 48 L16 54 M48 10 L54 16" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M10 16 L16 10 M48 54 L54 48" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>',
    swap: '<svg viewBox="0 0 64 64" fill="none"><path d="M16 32 A 16 16 0 0 1 48 32" stroke="currentColor" stroke-width="3" fill="none" marker-end="url(#arrow)"/><path d="M48 32 A 16 16 0 0 1 16 32" stroke="currentColor" stroke-width="3" fill="none" transform="rotate(180 32 32)"/><path d="M44 26 L48 32 L44 38" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 38 L16 32 L20 26" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

// 视觉特效引擎
const VisualFX = {
    canvas: null,
    ctx: null,
    animationId: null,
    particles: [], 
    
    init: function() {
        this.canvas = document.getElementById('fxCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    },

    resize: function() {
        if (!this.canvas) return;
        const wrapper = document.querySelector('.board-wrapper');
        if (wrapper) {
            this.canvas.width = wrapper.offsetWidth;
            this.canvas.height = wrapper.offsetHeight;
        }
    },

    clear: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = [];
    },

    getCoords: function(r, c) {
        const cell = document.getElementById(`c-${r}-${c}`);
        const wrapper = document.querySelector('.board-wrapper');
        if (!cell || !wrapper) return null;
        const cRect = cell.getBoundingClientRect();
        const wRect = wrapper.getBoundingClientRect();
        return {
            x: cRect.left - wRect.left + cRect.width / 2,
            y: cRect.top - wRect.top + cRect.height / 2
        };
    },

    drawWinLine: function(lineCells, type) {
        if (!this.ctx || lineCells.length < 2) return;
        this.clear();
        const points = lineCells.map(p => this.getCoords(p.r, p.c)).filter(p => p);
        if (points.length < 2) return;
        this.startAnimation(points, type);
    },

    startAnimation: function(points, type) {
        let startTime = performance.now();
        let lightningData = null;
        if (type === 'lightning') {
            lightningData = this.generateLightningPath(points[0], points[points.length-1], 35);
        }
        if (type === 'default' || type === 'gold') {
            for(let i=0; i<30; i++) {
                this.particles.push({
                    t: Math.random(), 
                    offset: (Math.random() - 0.5) * 20, 
                    speed: 0.002 + Math.random() * 0.005,
                    size: Math.random() * 3 + 1,
                    life: Math.random() * Math.PI * 2,
                    blinkSpeed: 0.05 + Math.random() * 0.1
                });
            }
        }

        const loop = (now) => {
            const elapsed = now - startTime;
            if (elapsed > 2000) return; 
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (type === 'default') this.renderDefault(points, elapsed);
            else if (type === 'lightning') this.renderLightning(points, lightningData, elapsed);
            else if (type === 'gold') this.renderGold(points, elapsed);
            else if (type === 'future') this.renderFuture(points, elapsed);

            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    },

    // --- Renderers ---
    renderDefault: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0];
        const end = points[points.length-1];
        const breath = (Math.sin(elapsed * 0.005) + 1) * 0.5; 
        
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 6 + breath * 4;
        ctx.strokeStyle = '#00e676';
        ctx.shadowColor = '#69f0ae';
        ctx.shadowBlur = 15 + breath * 10;
        ctx.stroke();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#e8f5e9';
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.fillStyle = '#b9f6ca';
        this.particles.forEach(p => {
            p.t += p.speed;
            if(p.t > 1) p.t = 0;
            const px = start.x + (end.x - start.x) * p.t;
            const py = start.y + (end.y - start.y) * p.t;
            const floatY = p.offset - (elapsed * 0.02); 
            const alpha = (Math.sin(elapsed * p.blinkSpeed + p.life) + 1) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(px, py + floatY, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    },

    renderLightning: function(points, data, elapsed) {
        const ctx = this.ctx;
        if (Math.random() > 0.85) return; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const drawPath = (pathData, width, color, blur, alpha) => {
            ctx.beginPath();
            ctx.moveTo(pathData.main[0].x, pathData.main[0].y);
            pathData.main.forEach(p => ctx.lineTo(p.x, p.y));
            pathData.branches.forEach(branch => {
                ctx.moveTo(branch[0].x, branch[0].y);
                branch.forEach(p => ctx.lineTo(p.x, p.y));
            });
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = blur ? '#03a9f4' : 'transparent';
            ctx.shadowBlur = blur;
            ctx.stroke();
        };
        const flicker = 0.8 + Math.random() * 0.2;
        drawPath(data, 6, '#00B0FF', 40, 0.4 * flicker);
        drawPath(data, 3, '#40C4FF', 20, 0.8 * flicker);
        drawPath(data, 1.5, '#FFFFFF', 0, 1.0 * flicker);
        ctx.globalAlpha = 1; 
    },

    generateLightningPath: function(start, end, displace) {
        const createPts = (p1, p2, dis) => {
            if (dis < 2) return [p1, p2];
            let midX = (p1.x + p2.x) / 2;
            let midY = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const normalX = -dy / len;
            const normalY = dx / len;
            const offset = (Math.random() - 0.5) * dis;
            midX += normalX * offset;
            midY += normalY * offset;
            const mid = {x: midX, y: midY};
            const seg1 = createPts(p1, mid, dis * 0.55);
            const seg2 = createPts(mid, p2, dis * 0.55);
            return seg1.concat(seg2.slice(1));
        };
        const main = createPts(start, end, displace);
        const branches = [];
        const totalDist = Math.hypot(end.x - start.x, end.y - start.y);
        const numBranches = Math.floor(totalDist / 50);
        for (let i = 0; i < numBranches; i++) {
            const idx = Math.floor(Math.random() * (main.length - 1));
            const root = main[idx];
            const angle = Math.random() * Math.PI * 2;
            const len = 20 + Math.random() * 30;
            const tip = { x: root.x + Math.cos(angle) * len, y: root.y + Math.sin(angle) * len };
            branches.push(createPts(root, tip, 10));
        }
        return { main, branches };
    },

    renderGold: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0];
        const end = points[points.length-1];
        const shift = (elapsed * 0.0015) % 1; 
        const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        grad.addColorStop(0, '#FFC107'); 
        grad.addColorStop(Math.max(0, shift - 0.15), '#FFD54F');
        grad.addColorStop(shift, '#FFFFFF'); 
        grad.addColorStop(Math.min(1, shift + 0.15), '#FFD54F');
        grad.addColorStop(1, '#FFC107');
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)';
        ctx.shadowColor = '#FF6F00';
        ctx.shadowBlur = 25;
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 5;
        ctx.stroke();
        this.particles.forEach(p => {
            const twinkle = Math.abs(Math.sin(elapsed * p.blinkSpeed * 2));
            if (twinkle < 0.2) return;
            const t = p.t; 
            const px = start.x + (end.x - start.x) * t + p.offset;
            const py = start.y + (end.y - start.y) * t + p.offset;
            ctx.fillStyle = '#FFF';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFF';
            const size = p.size * twinkle * 1.5;
            ctx.beginPath();
            ctx.moveTo(px, py - size);
            ctx.quadraticCurveTo(px, py, px + size, py);
            ctx.quadraticCurveTo(px, py, px, py + size);
            ctx.quadraticCurveTo(px, py, px - size, py);
            ctx.quadraticCurveTo(px, py, px, py - size);
            ctx.fill();
        });
    },

    renderFuture: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0];
        const end = points[points.length-1];
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ea80fc';
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(224, 64, 251, 0.3)';
        ctx.stroke();
        const segments = 12;
        const dx = (end.x - start.x) / segments;
        const dy = (end.y - start.y) / segments;
        ctx.beginPath();
        for (let i = 0; i < segments; i++) {
            const sX = start.x + dx * i;
            const sY = start.y + dy * i;
            const eX = start.x + dx * (i+1);
            const eY = start.y + dy * (i+1);
            let offsetX = 0, offsetY = 0;
            if (Math.random() > 0.85) { 
                offsetX = (Math.random() - 0.5) * 15;
                offsetY = (Math.random() - 0.5) * 15;
            }
            ctx.moveTo(sX + offsetX, sY + offsetY);
            ctx.lineTo(eX + offsetX, eY + offsetY);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = Math.random() > 0.5 ? '#00e5ff' : '#d500f9';
        ctx.stroke();
        const speed = 0.004;
        const runnerT = (elapsed * speed) % 1;
        const rx = start.x + (end.x - start.x) * runnerT;
        const ry = start.y + (end.y - start.y) * runnerT;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(Math.atan2(end.y - start.y, end.x - start.x));
        ctx.fillRect(-10, -3, 20, 6);
        ctx.restore();
    }
};