import { describe, expect, it } from 'vitest'

import { buildInitializrGenerateParams } from './initializr-generate-params'

describe('buildInitializrGenerateParams', () => {
  it('maps required generation fields to Initializr query params in stable order', () => {
    const params = buildInitializrGenerateParams({
      buildTool: 'maven-project',
      language: 'java',
      springBootVersion: '3.4.0',
      group: 'com.example',
      artifact: 'demo',
      name: 'demo',
      description: 'Demo project',
      packageName: 'com.example.demo',
      packaging: 'jar',
      javaVersion: '21',
      selectedDependencyIds: ['web', 'data-jpa'],
    })

    expect(params).toEqual([
      ['type', 'maven-project'],
      ['language', 'java'],
      ['bootVersion', '3.4.0'],
      ['baseDir', 'demo'],
      ['groupId', 'com.example'],
      ['artifactId', 'demo'],
      ['name', 'demo'],
      ['description', 'Demo project'],
      ['packageName', 'com.example.demo'],
      ['packaging', 'jar'],
      ['javaVersion', '21'],
      ['dependencies', 'web,data-jpa'],
    ])
  })

  it('omits optional params when values are empty', () => {
    const params = buildInitializrGenerateParams({
      buildTool: 'gradle-project',
      language: 'kotlin',
      springBootVersion: '  ',
      group: 'com.example',
      artifact: 'demo',
      name: 'demo',
      description: '',
      packageName: undefined,
      packaging: 'war',
      javaVersion: '17',
      selectedDependencyIds: [],
    })

    expect(params).toEqual([
      ['type', 'gradle-project'],
      ['language', 'kotlin'],
      ['baseDir', 'demo'],
      ['groupId', 'com.example'],
      ['artifactId', 'demo'],
      ['name', 'demo'],
      ['packaging', 'war'],
      ['javaVersion', '17'],
    ])
  })

  it('serializes selected dependencies as a comma-separated value with trimming and deduping', () => {
    const params = buildInitializrGenerateParams({
      buildTool: 'maven-project',
      language: 'java',
      springBootVersion: '3.4.0',
      group: 'com.example',
      artifact: 'demo',
      name: 'demo',
      description: 'Demo',
      packageName: 'com.example.demo',
      packaging: 'jar',
      javaVersion: '21',
      selectedDependencyIds: [' web ', '', 'actuator', 'web', 'actuator'],
    })

    expect(params.at(-1)).toEqual(['dependencies', 'web,actuator'])
  })
})
