#!/usr/bin/env node
(async () => {
    const fs = require('fs')
    const path = require('path')
    const puppeteer = require('puppeteer-extra')
    const baseUrl = 'https://www.watagames.com/populations/'
    const systems = [
        { name: '2600', states: ['sealed', 'cib'] },
        { name: '5200', states: ['sealed'] },
        { name: '7800', states: ['sealed'] },
        { name: 'colecovision', states: ['sealed'] },
        { name: 'intellivision', states: ['sealed'] },
        { name: 'turbografx16', states: ['sealed'] },
        { name: 'turbografxcd', states: ['sealed'] },
        { name: '3ds', states: ['sealed'] },
        { name: 'n64', states: ['sealed', 'cib', 'intl_sealed'] },
        { name: 'ds', states: ['sealed'] },
        { name: 'nes', states: ['sealed', 'cib', 'intl_sealed', 'loose'] },
        { name: 'gb', states: ['sealed', 'cib', 'intl_sealed'] },
        { name: 'gba', states: ['sealed', 'cib', 'intl_sealed'] },
        { name: 'gbc', states: ['sealed', 'cib', 'intl_sealed'] },
        { name: 'gamecube', states: ['sealed'] },
        { name: 'switch', states: ['sealed'] },
        { name: 'virtual_boy', states: ['sealed'] },
        { name: 'wii', states: ['sealed'] },
        { name: 'wii_u', states: ['sealed'] },
        { name: 'snes', states: ['sealed', 'cib', 'loose', 'intl_sealed'] },
        { name: 'sega_cd', states: ['sealed'] },
        { name: 'dreamcast', states: ['sealed'] },
        { name: 'genesis', states: ['sealed', 'cib'] },
        { name: 'sms', states: ['sealed', 'cib'] },
        { name: 'saturn', states: ['sealed'] },
        { name: '32x', states: ['sealed'] },
        { name: 'ps1', states: ['sealed'] },
        { name: 'ps2', states: ['sealed'] },
        { name: 'ps3', states: ['sealed'] },
        { name: 'ps4', states: ['sealed'] },
        { name: 'xbox', states: ['sealed'] },
        { name: 'xbox_360', states: ['sealed'] },
    ]
    const targetFolder = 'WATA_2025_02'

    // create the output dir if it doesn't exist
    fs.mkdirSync(targetFolder, { recursive: true })
    
    const StealthPlugin = require('puppeteer-extra-plugin-stealth')
    puppeteer.use(StealthPlugin())

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    for (let i = 0; i < systems.length; i++) {
        const sys = systems[i]
        for (let j = 0; j < sys.states.length; j++) {
            const state = sys.states[j]
            const filename = `pop_report_${sys.name}_${state}.json`
            await page.goto(`${baseUrl}${sys.name}/${filename}`);
            const content = await page.$eval('body pre', el => el.textContent)
            fs.writeFileSync(`${targetFolder}${path.sep}${filename}`, content)
        }
    }

    setTimeout(async () => {
        await browser.close()
    }, 20000)
    
})();