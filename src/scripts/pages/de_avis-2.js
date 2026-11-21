
    // ------ Utils ------
    const STAR = (filled = false) => `
      <svg viewBox="0 0 20 20" class="h-5 w-5 ${filled ? 'fill-yellow-400' : 'fill-gray-300'}" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10.5 13.348a1 1 0 00-1.175 0l-2.883 2.134c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.807 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.242-3.293z"/>
      </svg>`;

    const formatDate = (ts) => new Date(ts).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: '2-digit'
    });

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    // ------ Local Storage Layer ------
    const STORAGE_KEY = 'demo-reviews-v1';

    const store = {
      all() {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch { return []; }
      },
      save(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); },
      clear() { localStorage.removeItem(STORAGE_KEY); }
    };

    // ------ Rating (5 étoiles accessibles) ------
    const ratingEl = document.getElementById('rating');
    let currentRating = 0;

    const renderStarsInput = (value = 0) => {
      ratingEl.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'p-1 focus-visible:ring-2 focus-visible:ring-brand-500 rounded';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(i === value));
        btn.setAttribute('aria-label', `${i} étoile${i>1?'s':''}`);
        btn.innerHTML = STAR(i <= value);
        btn.addEventListener('click', () => {
          currentRating = i;
          renderStarsInput(currentRating);
        });
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight') { currentRating = clamp(currentRating + 1, 1, 5); renderStarsInput(currentRating); }
          if (e.key === 'ArrowLeft')  { currentRating = clamp(currentRating - 1, 1, 5); renderStarsInput(currentRating); }
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); ratingEl.querySelector(`[aria-label="${currentRating} étoile${currentRating>1?'s':''}"]`).click(); }
        });
        ratingEl.appendChild(btn);
      }
    };

    // ------ Form logic ------
    const form = document.getElementById('reviewForm');
    const charCount = document.getElementById('charCount');
    const comment = document.getElementById('comment');
    const formError = document.getElementById('formError');
    const formSuccess = document.getElementById('formSuccess');

    comment.addEventListener('input', () => {
      charCount.textContent = `${comment.value.length}/600`;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formError.classList.add('hidden');
      formSuccess.classList.add('hidden');

      const name = document.getElementById('name').value.trim();
      const title = document.getElementById('title').value.trim();
      const consent = document.getElementById('consent').checked;

      if (!currentRating) {
        formError.textContent = 'Veuillez sélectionner une note.';
        formError.classList.remove('hidden');
        return;
      }
      if (!comment.value.trim()) {
        formError.textContent = 'Le commentaire est requis.';
        formError.classList.remove('hidden');
        return;
      }
      if (!consent) {
        formError.textContent = "Merci d'accepter l'affichage public de votre avis.";
        formError.classList.remove('hidden');
        return;
      }

      const reviews = store.all();
      const payload = {
        id: crypto.randomUUID(),
        name: name || 'Anonyme',
        initials: (name || 'Anonyme').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase(),
        title,
        comment: comment.value.trim(),
        rating: currentRating,
        createdAt: Date.now()
      };
      reviews.push(payload);
      store.save(reviews);

      form.reset();
      currentRating = 0;
      renderStarsInput(0);
      charCount.textContent = '0/600';
      formSuccess.classList.remove('hidden');

      renderReviews();
      renderSummary();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Supprimer toutes les données locales ?')) {
        store.clear();
        renderReviews();
        renderSummary();
      }
    });

    document.getElementById('sortBy').addEventListener('change', renderReviews);

    // ------ Render summary (average + distribution) ------
    const averageRatingEl = document.getElementById('averageRating');
    const averageStarsEl = document.getElementById('averageStars');
    const distributionEl = document.getElementById('distribution');

    const renderSummary = () => {
      const list = store.all();
      const count = list.length;
      const avg = count ? (list.reduce((a, r) => a + r.rating, 0) / count) : 0;
      averageRatingEl.textContent = avg.toFixed(1);

      // Stars for average
      averageStarsEl.innerHTML = '';
      const full = Math.round(avg);
      const frag = document.createDocumentFragment();
      for (let i = 1; i <= 5; i++) {
        const wrap = document.createElement('span');
        wrap.innerHTML = STAR(i <= full);
        frag.appendChild(wrap);
      }
      averageStarsEl.appendChild(frag);

      // Distribution 5 -> 1
      const dist = {1:0,2:0,3:0,4:0,5:0};
      list.forEach(r => dist[r.rating]++);

      distributionEl.innerHTML = '';
      for (let i = 5; i >= 1; i--) {
        const row = document.createElement('li');
        const pct = count ? Math.round((dist[i] / count) * 100) : 0;
        row.className = 'flex items-center gap-2';
        row.innerHTML = `
          <span class="w-10 text-sm tabular-nums">${i}★</span>
          <div class="h-2 rounded-full bg-gray-200 w-full overflow-hidden">
            <div class="h-full bg-yellow-400" style="width:${pct}%"></div>
          </div>
          <span class="w-10 text-right text-sm tabular-nums">${dist[i]}</span>
        `;
        distributionEl.appendChild(row);
      }
    };

    // ------ Render list ------
    const reviewsEl = document.getElementById('reviews');
    const tpl = document.getElementById('reviewItemTpl');

    const renderStars = (n) => {
      let html = '<div class="flex items-center gap-0.5">';
      for (let i = 1; i <= 5; i++) html += STAR(i <= n);
      html += '</div>';
      return html;
    };

    const renderReviews = () => {
      const sortBy = document.getElementById('sortBy').value;
      const list = store.all().slice();
      list.sort((a,b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'oldest') return a.createdAt - b.createdAt;
        if (sortBy === 'highest') return b.rating - a.rating || b.createdAt - a.createdAt;
        if (sortBy === 'lowest') return a.rating - b.rating || b.createdAt - a.createdAt;
        return 0;
      });

      reviewsEl.innerHTML = '';
      if (!list.length) {
        reviewsEl.innerHTML = '<li class="py-8 text-center text-gray-500">Aucun avis pour le moment. Soyez le premier !</li>';
        return;
      }

      const frag = document.createDocumentFragment();
      list.forEach(r => {
        const node = tpl.content.cloneNode(true);
        const [avatar, header, stars, title, text, date] = [
          node.querySelector('.shrink-0'),
          node.querySelector('.font-medium'),
          node.querySelector('[aria-hidden]'),
          node.querySelector('.font-semibold'),
          node.querySelector('p'),
          node.querySelector('.whitespace-nowrap')
        ];
        avatar.textContent = r.initials;
        header.textContent = r.name;
        stars.innerHTML = renderStars(r.rating);
        title.textContent = r.title || '';
        if (!r.title) title.classList.add('hidden');
        text.textContent = r.comment;
        date.textContent = formatDate(r.createdAt);
        frag.appendChild(node);
      });
      reviewsEl.appendChild(frag);
    };

    // ------ Init ------
    renderStarsInput(0);
    renderSummary();
    renderReviews();
  
