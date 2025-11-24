document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');

    // Back to Top button
    const backToTop = document.createElement('button');
    backToTop.id = 'backToTop';
    backToTop.textContent = '↑ Top';
    backToTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(backToTop);

    window.addEventListener('scroll', () => {
        backToTop.style.display = window.pageYOffset > 300 ? 'block' : 'none';
    });
});

