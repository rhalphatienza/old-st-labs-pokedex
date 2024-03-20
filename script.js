document.addEventListener('DOMContentLoaded', () => {
    const pokemonListElement = document.getElementById('pokemon-list');
    const loadMoreButton = document.getElementById('load-more');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const sortSelect = document.getElementById('sort-select');
    let allPokemons = []; // Stores names and URLs of all pokemons
    let filteredPokemons = []; // Stores filtered subset based on search criteria
    let currentFilter = ''; // Tracks the current filter
    const batchSize = 10; // Number of pokemons to display per batch
    let currentDisplayIndex = 0; // Index for next batch in the filtered subset
    let currentPokemonIndex = 0;

    function capitalizeWords(str) {
        return str.split(' ') // Split the string into an array of words
            .map(word => word
                .split('-') // Split the word on hyphens
                .map(part => {
                    if (part.toLowerCase() === 'hp') {
                        return 'HP';
                    }
                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                })
                .join(' ')
            )
            .join(' ');
    }
    // Fetch all pokemon names and URLs
    const fetchAllPokemonNamesAndUrls = async () => {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1118`);
        const data = await response.json();
        allPokemons = data.results;
        applySorting();
    };

    // Apply sorting to allPokemons and reset display
    const applySorting = () => {
        pokemonListElement.innerHTML = ''
        if (sortSelect.value === 'name') {
            allPokemons.sort((a, b) => a.name.localeCompare(b.name));
        } else { // Sort by ID extracted from URL
            allPokemons.sort((a, b) => parseInt(a.url.split('/')[6]) - parseInt(b.url.split('/')[6]));
        }
        // Reapply filter after sorting if any
        filterPokemons(currentFilter);
    };

    // Display pokemons based on filteredPokemons and currentDisplayIndex
    const displayPokemons = async () => {
        const endIndex = Math.min(currentDisplayIndex + batchSize, filteredPokemons.length);

        for (let i = currentDisplayIndex; i < endIndex; i++) {
            let pokemon = filteredPokemons[i];
            if (!pokemon.details) { // Fetch details if not already done
                pokemon.details = await fetchPokemonDetails(pokemon.url);
            }
            displayPokemon(pokemon.details, i); // This function appends each new Pokémon to the list
        }
        currentDisplayIndex = endIndex; // Update for next batch
        updateLoadMoreVisibility();
    };

    const updateLoadMoreVisibility = () => {
        loadMoreButton.style.display = currentDisplayIndex < filteredPokemons.length ? 'block' : 'none';
    };

    const fetchPokemonDetails = async (url) => {
        const response = await fetch(url);
        return response.json();
    };

    const displayPokemon = (pokemon, index) => {
        const pokemonCard = document.createElement('div');
        pokemonCard.classList.add('card');
        pokemonCard.innerHTML = `
            <img src="https://assets.pokemon.com/assets/cms2/img/pokedex/full/${pokemon.id.toString().padStart(3, '0')}.png" alt="${pokemon.name}">
            <p>ID: ${pokemon.id.toString().padStart(3, '0')}</p>
            <h3>${capitalizeWords(pokemon.name)}</h3>
            <p>Type: ${pokemon.types.map(type => capitalizeWords(type.type.name)).join(', ')}</p>
        `;
        pokemonCard.addEventListener('click', () => {
            currentPokemonIndex = index; 
            displayPokemonDetailsModal(pokemon);
        });
        pokemonListElement.appendChild(pokemonCard);
    };


        // Display Pokemon Details Modal Function
    const displayPokemonDetailsModal = (pokemon) => {
        const modal = document.getElementById('pokemon-detail-modal');
        const typeWeaknesses = {
            normal: ['fighting'],
            fire: ['water', 'ground', 'rock'],
            water: ['electric', 'grass'],
            electric: ['ground'],
            grass: ['fire', 'ice', 'poison', 'flying', 'bug'],
            ice: ['fire', 'fighting', 'rock', 'steel'],
            fighting: ['flying', 'psychic', 'fairy'],
            poison: ['ground', 'psychic'],
            ground: ['water', 'grass', 'ice'],
            flying: ['electric', 'ice', 'rock'],
            psychic: ['bug', 'ghost', 'dark'],
            bug: ['fire', 'flying', 'rock'],
            rock: ['water', 'grass', 'fighting', 'ground', 'steel'],
            ghost: ['ghost', 'dark'],
            dragon: ['ice', 'dragon', 'fairy'],
            dark: ['fighting', 'bug', 'fairy'],
            steel: ['fire', 'fighting', 'ground'],
            fairy: ['poison', 'steel']
        };
        
        modal.style.display = 'block';
        
        // Populate basic details
        document.getElementById('pokemon-name').textContent = capitalizeWords(pokemon.name);
        document.getElementById('pokemon-id').innerHTML = `<b>ID:</b> ${pokemon.id.toString().padStart(3, '0')}`;
        document.getElementById('pokemon-image').src = `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${pokemon.id.toString().padStart(3, '0')}.png`;
        document.getElementById('pokemon-height').innerHTML = `<b>Height:</b> ${pokemon.height / 10} m`; // Convert decimetres to meters
        document.getElementById('pokemon-weight').innerHTML = `<b>Weight:</b> ${pokemon.weight / 10} kg`; // Convert hectograms to kilograms
        document.getElementById('pokemon-types').innerHTML = `<b>Types:</b> ${pokemon.types.map(type => capitalizeWords(type.type.name)).join(', ')}`;

        // Populate abilities
        const abilities = pokemon.abilities.map(ability => capitalizeWords(ability.ability.name)).join(', ');
        document.getElementById('pokemon-abilities').innerHTML = `<b>Abilities:</b> ${abilities}`;

        // Populate stats
        const statsElement = document.getElementById('pokemon-stats');
        statsElement.innerHTML = pokemon.stats.map(stat => `${capitalizeWords(stat.stat.name)}: ${stat.base_stat}`).join('<br>');

        // Populate moves - showing first 5 for brevity
        const movesElement = document.getElementById('pokemon-moves');
        movesElement.innerHTML = '<b>Moves:</b> ' + pokemon.moves.slice(0, 5).map(move => capitalizeWords(move.move.name)).join(', ');

        const weaknessesSet = new Set(); // Use a Set to avoid duplicate weaknesses
        pokemon.types.forEach(typeInfo => {
            const weaknesses = typeWeaknesses[typeInfo.type.name];
            weaknesses.forEach(weakness => weaknessesSet.add(weakness));
        });

        const weaknesses = Array.from(weaknessesSet).join(', ');
        document.getElementById('pokemon-weaknesses').innerHTML = `<b>Weaknesses:</b> ${capitalizeWords(weaknesses)}`;


        const prevButton = document.getElementById('prev-pokemon');
        const nextButton = document.getElementById('next-pokemon');

        // Remove existing event listeners to prevent duplicates
        prevButton.removeEventListener('click', navigateToPreviousPokemon);
        nextButton.removeEventListener('click', navigateToNextPokemon);

        // Add event listeners back to the buttons
        prevButton.addEventListener('click', navigateToPreviousPokemon);
        nextButton.addEventListener('click', navigateToNextPokemon);


        // Close modal event
        document.querySelector('.close-button').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    };

    function navigateToPreviousPokemon() {
        navigatePokemon(-1);
    }

    function navigateToNextPokemon() {
        navigatePokemon(1);
    }

    const navigatePokemon = (direction) => {
        currentPokemonIndex += direction;
        if (currentPokemonIndex < 0 || currentPokemonIndex >= filteredPokemons.length) {
            currentPokemonIndex = currentPokemonIndex;
        }
        const nextPokemon = filteredPokemons[currentPokemonIndex];
        if (!nextPokemon.details) {
            fetchPokemonDetails(nextPokemon.url).then(details => {
                nextPokemon.details = details;
                displayPokemonDetailsModal(details);
            });
        } else {
            displayPokemonDetailsModal(nextPokemon.details);
        }
    };



    // Filter pokemons based on search term and update display
    const filterPokemons = (searchTerm) => {
        pokemonListElement.innerHTML = ''; 
        currentFilter = searchTerm.trim().toLowerCase();
        if (currentFilter) {
            filteredPokemons = allPokemons.filter(pokemon => pokemon.name.toLowerCase().includes(currentFilter));
        } else {
            filteredPokemons = [...allPokemons]; // No filter, use all pokemons
        }
        currentDisplayIndex = 0; // Reset display index for new filtered list
        displayPokemons();
        
    };

    sortSelect.addEventListener('change', applySorting);
    searchButton.addEventListener('click', () => filterPokemons(searchInput.value));
    loadMoreButton.addEventListener('click', displayPokemons);

    fetchAllPokemonNamesAndUrls();
});
