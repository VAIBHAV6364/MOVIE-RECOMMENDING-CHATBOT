document.addEventListener('DOMContentLoaded', () => {
    const chatDisplay = document.getElementById('chat-display');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let step = 0;
    let type = ''; // Movie or TV Show
    let genre = '';
    let language = '';
    let userNeedsMore = false;
    let seenRecommendations = []; // Track the seen recommendations

    const genres = {
        movie: {
            28: "Action",
            12: "Adventure",
            16: "Animation",
            35: "Comedy",
            80: "Crime",
            99: "Documentary",
            18: "Drama",
            10751: "Family",
            14: "Fantasy",
            36: "History",
            27: "Horror",
            10402: "Music",
            9648: "Mystery",
            10749: "Romance",
            878: "Science Fiction",
            10770: "TV Movie",
            53: "Thriller",
            10752: "War",
            37: "Western"
        },
        tv: {
            10759: "Action & Adventure",
            16: "Animation",
            35: "Comedy",
            80: "Crime",
            99: "Documentary",
            18: "Drama",
            10751: "Family",
            10762: "Kids",
            9648: "Mystery",
            10763: "News",
            10764: "Reality",
            10765: "Sci-Fi & Fantasy",
            10766: "Soap",
            10767: "Talk",
            10768: "War & Politics",
            37: "Western"
        }
    };

    const languages = {
        en: "English",
        hi: "Hindi",
        es: "Spanish",
        fr: "French",
        ja: "Japanese"
    };

    // Helper function to display bot messages
    const botMessage = (message) => {
        const botMsg = document.createElement('div');
        botMsg.classList.add('message', 'bot');
        botMsg.innerHTML = message;
        chatDisplay.appendChild(botMsg);
        chatDisplay.scrollTop = chatDisplay.scrollHeight; // Auto-scroll
    };

    // Helper function to display user messages
    const userMessage = (message) => {
        const userMsg = document.createElement('div');
        userMsg.classList.add('message', 'user');
        userMsg.textContent = message;
        chatDisplay.appendChild(userMsg);
        chatDisplay.scrollTop = chatDisplay.scrollHeight; // Auto-scroll
    };

    // TMDB API helper functions
    const fetchRecommendations = async () => {
        const apiKey = '29d8bfb52bf055674fbe4c6a9456368d';
        const url = `https://api.themoviedb.org/3/discover/${type}?api_key=${apiKey}&with_genres=${genre}&language=${language}&sort_by=popularity.desc`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            // Filter out recommendations already shown
            const newRecommendations = data.results.filter(rec => !seenRecommendations.includes(rec.id));
            return newRecommendations.slice(0, 5); // Top 5 new recommendations
        } catch (error) {
            botMessage("Oops! Couldn't fetch recommendations. Please try again.");
            return [];
        }
    };

    const fetchDetails = async (id) => {
        const apiKey = '29d8bfb52bf055674fbe4c6a9456368d';
        const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&append_to_response=credits`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            const director = data.credits.crew.find(person => person.job === 'Director')?.name || 'Unknown';
            const cast = data.credits.cast.slice(0, 3).map(actor => actor.name).join(', ') || 'Unknown';
            const platforms = data.watch_providers?.results?.US?.flatrate?.map(provider => provider.provider_name).join(', ') || 'Unknown';
            const releaseYear = type === 'movie' ? data.release_date?.split('-')[0] : data.first_air_date?.split('-')[0];
            const seasons = type === 'tv' ? data.number_of_seasons : null;
            const posterUrl = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null;

            return { director, cast, platforms, releaseYear, seasons, posterUrl };
        } catch (error) {
            return { director: 'Unknown', cast: 'Unknown', platforms: 'Unknown', releaseYear: 'Unknown', seasons: null, posterUrl: null };
        }
    };

    // Step-based conversation logic
    const handleInput = async (input) => {
        if (step === 0) {
            botMessage("I can recommend movies and TV shows. Would you like a recommendation for a movie or a TV show? Type 'movie' for movies and 'tv show' for series.");
            step++;
        } else if (step === 1) {
            if (input.toLowerCase() === 'movie' || input.toLowerCase() === 'tv show') {
                type = input.toLowerCase() === 'movie' ? 'movie' : 'tv';
                const genreOptions = Object.values(genres[type]).map(name => `- ${name}`).join('<br>');
                botMessage(`Great! What genre do you prefer? Here are the options:<br>${genreOptions}<br>Type the name of the genre.`);
                step++;
            } else {
                botMessage("Please type 'movie' or 'tv show' to proceed.");
            }
        } else if (step === 2) {
            const selectedGenre = Object.values(genres[type]).find(
                g => g.toLowerCase() === input.toLowerCase()
            );
            if (selectedGenre) {
                genre = Object.keys(genres[type]).find(
                    id => genres[type][id].toLowerCase() === selectedGenre.toLowerCase()
                );
                botMessage(`Got it! Now, what language do you prefer your synopsis to be in? Here are the options:`);
                Object.entries(languages).forEach(([code, name]) => {
                    botMessage(`${name} (Type '${name.toLowerCase()}')`);
                });
                step++;
            } else {
                botMessage("Please select a valid genre from the options.");
            }
        } else if (step === 3) {
            const selectedLanguage = Object.values(languages).find(
                lang => lang.toLowerCase() === input.toLowerCase()
            );
            if (selectedLanguage) {
                language = Object.keys(languages).find(
                    code => languages[code].toLowerCase() === selectedLanguage.toLowerCase()
                );
                botMessage("Fetching recommendations...");
                const recommendations = await fetchRecommendations();
                if (recommendations.length > 0) {
                    for (const rec of recommendations) {
                        const { director, cast, platforms, releaseYear, seasons, posterUrl } = await fetchDetails(rec.id);
                        botMessage(`
                            <strong>${rec.title || rec.name}</strong><br>
                            ${posterUrl ? `<img src="${posterUrl}" alt="${rec.title || rec.name} poster" style="max-width: 200px; margin-top: 10px;">` : ''}
                            Release Year: ${releaseYear}<br>
                            ${type === 'tv' ? `Seasons: ${seasons}` : ''}<br>
                            Director: ${director}<br>
                            Cast: ${cast}<br>
                            Platforms: ${platforms}<br>
                            Overview: ${rec.overview || 'No overview available.'}<br>
                        `);
                        seenRecommendations.push(rec.id);
                    }
                } else {
                    botMessage("Sorry, no more recommendations available.");
                }
                botMessage("Would you like more recommendations? (Type 'yes' or 'no')");
                step = 4;
            } else {
                botMessage("Please select a valid language from the options.");
            }
        } else if (step === 4) {
            if (input.toLowerCase() === 'yes') {
                botMessage("Fetching more recommendations...");
                const recommendations = await fetchRecommendations();
                if (recommendations.length > 0) {
                    for (const rec of recommendations) {
                        const { director, cast, platforms, releaseYear, seasons, posterUrl } = await fetchDetails(rec.id);
                        botMessage(`
                            <strong>${rec.title || rec.name}</strong><br>
                            ${posterUrl ? `<img src="${posterUrl}" alt="${rec.title || rec.name} poster" style="max-width: 200px; margin-top: 10px;">` : ''}
                            Release Year: ${releaseYear}<br>
                            ${type === 'tv' ? `Seasons: ${seasons}` : ''}<br>
                            Director: ${director}<br>
                            Cast: ${cast}<br>
                            Platforms: ${platforms}<br>
                            Overview: ${rec.overview || 'No overview available.'}<br>
                        `);
                        seenRecommendations.push(rec.id);
                    }
                } else {
                    botMessage("Sorry, no more recommendations available.");
                }
                botMessage("Would you like more recommendations? (Type 'yes' or 'no')");
            } else if (input.toLowerCase() === 'no') {
                botMessage("Okay, glad to help! Let me know if you need more recommendations anytime.");
                step = 0;
            } else {
                botMessage("Please type 'yes' or 'no'.");
            }
        }
    };

    // Event listeners for sending messages
    sendButton.addEventListener('click', () => {
        const input = userInput.value.trim();
        if (input) {
            userMessage(input);
            handleInput(input);
            userInput.value = '';
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Initial bot message
    botMessage("Hello! I'm Ent-Time-Bot. Ready to help you find your next movie or TV show!");
});
